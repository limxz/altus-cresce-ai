import { admin, corsHeaders, json, verifyClientSession } from "../_shared/os.ts";
import { buildBusinessContext, providerLabel } from "../_shared/context.ts";

const MODEL = "openai/gpt-5.6-sol";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";

const SYSTEM = `És o AltusOS — o sistema operativo de crescimento da Altus Media para UM negócio específico.

REGRAS ABSOLUTAS:
- Escreves em português de Portugal, direto, profissional, sem entusiasmo artificial.
- NUNCA inventas números. Usas exclusivamente os dados do contexto fornecido.
- Se uma métrica não existir no contexto porque a integração não está ligada, respondes exatamente:
  "Essa informação não está disponível porque a integração <nome> não está ligada."
- Se existirem dados mas forem insuficientes, respondes:
  "Não tenho dados suficientes para responder com confiança."
- Nunca apresentas previsões como garantias. Usas intervalos e assunções explícitas.
- Nunca mencionas outros clientes. Só existe este negócio.

FORMATO (markdown, secções apenas quando fizerem sentido):
**Resposta** — a conclusão em 1-3 frases com os números reais.
**Porquê** — os fatores que explicam o número.
**Dados usados** — que fonte e que período.
**Recomendação** — ação concreta e priorizada.

Podes criar ligações internas do portal no formato [texto](hub:resultados), [texto](hub:leads),
[texto](hub:website), [texto](hub:documentos), [texto](hub:alertas).
Sê breve. Máximo ~250 palavras salvo pedido explícito de detalhe.`;

const clientIdFrom = async (body: any) => {
  const cid = await verifyClientSession(body?.session);
  if (cid && (!body?.client_id || body.client_id === cid)) return cid;
  return null;
};

async function ensureConversation(ctxClient: any, conversationId?: string | null) {
  if (conversationId) {
    const { data } = await admin
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("client_id", ctxClient.id)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await admin
    .from("ai_conversations")
    .insert({ organization_id: ctxClient.organization_id, client_id: ctxClient.id, title: "Nova conversa" })
    .select()
    .single();
  return data;
}

function contextPayload(ctx: any) {
  return {
    negocio: {
      nome: ctx.client.business_name,
      setor: ctx.profile?.sector ?? ctx.client.industry ?? ctx.client.niche,
      subsetor: ctx.profile?.subsector ?? null,
      localizacao: ctx.profile?.location ?? null,
      area_geografica: ctx.profile?.service_area ?? null,
      descricao: ctx.profile?.description ?? null,
      servicos: ctx.profile?.products_services ?? null,
      publico_alvo: ctx.profile?.target_audience ?? null,
      ticket_medio: ctx.profile?.average_ticket ?? null,
      modelo_negocio: ctx.profile?.business_model ?? null,
      objetivo_principal: ctx.profile?.primary_goal ?? null,
      meta_mensal: ctx.profile?.monthly_target ?? null,
      inicio_acompanhamento: ctx.profile?.tracking_start_date ?? ctx.client.start_date,
    },
    objetivos: ctx.goals.map((g: any) => ({
      objetivo: g.label, metrica: g.metric, alvo: g.target, atual: g.current_value,
      progresso_pct: g.progress, prazo: g.deadline,
    })),
    integracoes_ligadas: ctx.connected.map(providerLabel),
    integracoes_nao_ligadas: ctx.missing.map(providerLabel),
    metricas: ctx.metrics,
    leads_recentes: ctx.leads.map((l: any) => ({
      nome: l.contact_name, estado: l.lead_status, urgencia: l.urgency,
      necessidade: l.primary_need, ultima_mensagem_em: l.last_message_at,
    })),
    atividade_recente: ctx.activity.slice(0, 15),
    insights_abertos: ctx.insights.map((i: any) => ({ titulo: i.title, severidade: i.severity, descricao: i.description })),
    profundidade_de_dados_dias: ctx.dataDepthDays,
    confianca: ctx.confidence,
  };
}

async function streamChat(ctx: any, conversation: any, history: any[], question: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ error: "O AltusOS está temporariamente indisponível." }, 503);

  const input = [
    { role: "system", content: [{ type: "input_text", text: SYSTEM }] },
    {
      role: "user",
      content: [{
        type: "input_text",
        text: `CONTEXTO DE NEGÓCIO (única fonte de verdade):\n${JSON.stringify(contextPayload(ctx))}`,
      }],
    },
    ...history.slice(-10).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }],
    })),
    { role: "user", content: [{ type: "input_text", text: question }] },
  ];

  const upstream = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: MODEL, input, stream: true, store: false, reasoning: { effort: "low", summary: "auto" } }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text();
    console.error("altus-os gateway error", upstream.status, detail.slice(0, 400));
    const message = upstream.status === 429
      ? "Demasiados pedidos ao AltusOS. Tenta novamente dentro de um minuto."
      : upstream.status === 402
        ? "Créditos de IA esgotados. Contacta a equipa Altus."
        : "Não consegui gerar a análise agora.";
    return json({ error: message }, upstream.status);
  }

  const sources = ctx.sources.filter((s: any) => s.status === "connected");
  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      send({ type: "meta", conversation_id: conversation.id, sources, confidence: ctx.confidence });

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw);
              if (evt.type === "response.output_text.delta" && evt.delta) {
                full += evt.delta;
                send({ type: "delta", text: evt.delta });
              } else if (evt.type === "response.reasoning_summary_text.delta" && evt.delta) {
                send({ type: "thinking", text: evt.delta });
              }
            } catch { /* ignore malformed chunk */ }
          }
        }
      } catch (e) {
        console.error("altus-os stream error", (e as Error).message);
      }

      if (!full.trim()) full = "Não consegui gerar uma análise com os dados atualmente disponíveis.";

      await admin.from("ai_messages").insert([
        { conversation_id: conversation.id, client_id: ctx.client.id, role: "user", content: question },
        {
          conversation_id: conversation.id,
          client_id: ctx.client.id,
          role: "assistant",
          content: full,
          sources,
          confidence: ctx.confidence,
        },
      ]);

      const patch: Record<string, unknown> = { last_message_at: new Date().toISOString() };
      if (conversation.title === "Nova conversa") {
        patch.title = question.length > 52 ? `${question.slice(0, 52)}…` : question;
      }
      await admin.from("ai_conversations").update(patch).eq("id", conversation.id);

      send({ type: "done", conversation_id: conversation.id, title: patch.title ?? conversation.title });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Pedido inválido." }, 400); }

  const clientId = await clientIdFrom(body);
  if (!clientId) return json({ error: "Sessão inválida." }, 401);

  const action = String(body.action ?? "context");

  if (action === "conversations") {
    const { data } = await admin
      .from("ai_conversations")
      .select("id, title, last_message_at, created_at")
      .eq("client_id", clientId)
      .is("archived_at", null)
      .order("last_message_at", { ascending: false })
      .limit(50);
    return json({ conversations: data ?? [] });
  }

  if (action === "messages") {
    const { data } = await admin
      .from("ai_messages")
      .select("id, role, content, sources, confidence, created_at")
      .eq("client_id", clientId)
      .eq("conversation_id", body.conversation_id)
      .order("created_at");
    return json({ messages: data ?? [] });
  }

  if (action === "rename_conversation") {
    const title = String(body.title ?? "").trim().slice(0, 80);
    if (!title) return json({ error: "Título inválido." }, 400);
    await admin.from("ai_conversations").update({ title }).eq("id", body.conversation_id).eq("client_id", clientId);
    return json({ ok: true });
  }

  if (action === "delete_conversation") {
    await admin.from("ai_conversations").delete().eq("id", body.conversation_id).eq("client_id", clientId);
    return json({ ok: true });
  }

  const ctx = await buildBusinessContext(clientId);
  if (!ctx) return json({ error: "Negócio não encontrado." }, 404);

  if (action === "create_conversation") {
    const conv = await ensureConversation(ctx.client, null);
    return json({ conversation: conv });
  }

  if (action === "context") {
    return json({
      client: ctx.client,
      profile: ctx.profile,
      goals: ctx.goals,
      integrations: ctx.integrations,
      connected: ctx.connected,
      missing: ctx.missing.map((p) => ({ provider: p, label: providerLabel(p) })),
      metrics: ctx.metrics,
      insights: ctx.insights,
      activity: ctx.activity,
      sources: ctx.sources,
      dataDepthDays: ctx.dataDepthDays,
      confidence: ctx.confidence,
    });
  }

  if (action === "chat") {
    const question = String(body.message ?? "").trim();
    if (!question) return json({ error: "Pergunta vazia." }, 400);
    const conversation = await ensureConversation(ctx.client, body.conversation_id);
    if (!conversation) return json({ error: "Não consegui abrir a conversa." }, 500);
    const { data: history } = await admin
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversation.id)
      .order("created_at");
    return streamChat(ctx, conversation, history ?? [], question);
  }

  if (action === "why") {
    const metric = String(body.metric ?? "").trim();
    if (!metric) return json({ error: "Métrica em falta." }, 400);
    const conversation = await ensureConversation(ctx.client, body.conversation_id);
    return streamChat(
      ctx,
      conversation,
      [],
      `Explica em detalhe porque é que a métrica "${metric}" está no valor atual e o que mudou face ao período anterior.`,
    );
  }

  return json({ error: "Ação desconhecida." }, 400);
});
