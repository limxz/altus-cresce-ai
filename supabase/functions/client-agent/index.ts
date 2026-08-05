import { admin, corsHeaders, json, notify } from "../_shared/os.ts";

/**
 * Specialised AI agent. Runs automatically after each successful sync.
 * Reads only real data (metrics + client memory) and produces an executive
 * report plus prioritised recommendations.
 */

const MODEL = "google/gemini-3-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { client_id, trigger = "manual" } = await req.json();
    if (!client_id) return json({ error: "client_id em falta." }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY não configurada." }, 500);

    const { data: client } = await admin
      .from("clients")
      .select("id, business_name, niche, industry, organization_id, mrr, plan")
      .eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "Cliente não encontrado." }, 404);

    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const [memRes, igRes, adsRes, postRes, convRes] = await Promise.all([
      admin.from("client_memory").select("*").eq("client_id", client_id).maybeSingle(),
      admin.from("instagram_metrics").select("date, followers_count, followers_gained, reach, engagement_rate")
        .eq("client_id", client_id).gte("date", since).order("date"),
      admin.from("ad_metrics").select("date, spend, impressions, clicks, conversions, messages_started, cost_per_conversion")
        .eq("client_id", client_id).gte("date", since).order("date"),
      admin.from("post_metrics").select("post_type, posted_at, reach, likes, comments, saves, shares, script_structure")
        .eq("client_id", client_id).order("posted_at", { ascending: false }).limit(20),
      admin.from("whatsapp_conversations").select("lead_status, is_read, started_at, last_message_at")
        .eq("client_id", client_id).gte("started_at", new Date(Date.now() - 30 * 864e5).toISOString()),
    ]);

    const ig = igRes.data ?? [];
    const ads = adsRes.data ?? [];
    const posts = postRes.data ?? [];
    const convos = convRes.data ?? [];
    const memory = memRes.data;

    if (!ig.length && !ads.length && !posts.length && !convos.length) {
      return json({ ok: false, skipped: true, reason: "Sem dados reais suficientes para analisar." });
    }

    const dataset = {
      cliente: {
        nome: client.business_name,
        nicho: memory?.niche ?? client.niche ?? client.industry,
        cidade: memory?.city ?? null,
        objetivos: memory?.goals ?? null,
        concorrentes: memory?.competitors ?? [],
        kpis: memory?.kpis ?? [],
        publico: memory?.audience ?? null,
        ofertas: memory?.offers ?? null,
        tom_de_comunicacao: memory?.tone ?? null,
        historico: memory?.history ?? null,
      },
      instagram_30d: ig,
      anuncios_30d: ads,
      publicacoes_recentes: posts,
      conversas_30d: {
        total: convos.length,
        por_responder: convos.filter((c) => c.is_read === false).length,
        interessados: convos.filter((c) => c.lead_status === "interessado").length,
        marcaram: convos.filter((c) => c.lead_status === "marcou_consulta").length,
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "És o analista sénior de crescimento da Altus Media. Escreves em português de Portugal, direto e sem floreados. " +
              "Analisas APENAS os dados reais fornecidos — nunca inventas métricas nem assumes dados em falta. " +
              "Se faltarem dados, dizes explicitamente o que falta ligar. Devolves exclusivamente JSON válido.",
          },
          {
            role: "user",
            content:
              "Analisa os dados deste cliente e devolve JSON com esta forma exata:\n" +
              '{"summary":"relatório executivo em 3-5 frases","highlights":["..."],"risks":["..."],' +
              '"actions":[{"title":"","description":"","priority":"alta|media|baixa","category":"conteudo|ads|timing|comercial","impact":"porquê importa"}]}\n' +
              "Máximo 5 ações, ordenadas por impacto real. Dados:\n" +
              JSON.stringify(dataset),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`AI gateway [${res.status}]: ${errBody}`);
      return json({ error: "Falha na análise IA", status: res.status, details: errBody }, res.status);
    }

    const ai = await res.json();
    const raw = ai.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { summary: raw }; }

    const actions = Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5) : [];

    await admin.from("client_reports").insert({
      organization_id: client.organization_id,
      client_id,
      period_start: since,
      period_end: new Date().toISOString().slice(0, 10),
      summary: parsed.summary ?? null,
      highlights: parsed.highlights ?? [],
      risks: parsed.risks ?? [],
      actions,
      source: trigger,
    });

    await admin.from("ai_recommendations").insert({
      client_id,
      period_start: since,
      period_end: new Date().toISOString().slice(0, 10),
      summary: parsed.summary ?? null,
      recommendations: actions,
    });

    const urgent = actions.filter((a: any) => a.priority === "alta").length;
    await notify({
      organization_id: client.organization_id,
      client_id,
      category: "ai_report",
      severity: urgent ? "atencao" : "info",
      title: `Novo relatório · ${client.business_name}`,
      detail: (parsed.summary ?? "Relatório executivo gerado.").slice(0, 200),
      href: `/admin/client/${client_id}`,
      dedupe_key: `report-${client_id}-${new Date().toISOString().slice(0, 13)}`,
    });

    return json({ ok: true, summary: parsed.summary, actions });
  } catch (e) {
    console.error("client-agent error", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
