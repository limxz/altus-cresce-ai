import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BRIEFING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          detail: { type: "string" },
          severity: { type: "string", enum: ["critico", "atencao", "oportunidade", "info"] },
          action: { type: "string" },
        },
        required: ["label", "detail", "severity", "action"],
      },
    },
  },
  required: ["headline", "signals"],
};

/** Streams /v1/responses and returns the accumulated output text. */
async function callLovableAI(
  apiKey: string,
  input: unknown,
  format?: Record<string, unknown>,
) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      input,
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      ...(format ? { text: { format } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI Gateway [${res.status}]: ${body}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          text += evt.delta;
        } else if (evt.type === "response.completed" && !text) {
          text = evt.response?.output_text ?? "";
        }
      } catch {
        // partial SSE frame
      }
    }
  }

  return text;
}

async function buildSnapshot(supabase: ReturnType<typeof createClient>) {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const sinceDate = since.slice(0, 10);

  const [clients, convos, pipeline, leads, ig, ads, posts] = await Promise.all([
    supabase.from("clients").select("id, business_name, niche, status, mrr, start_date"),
    supabase
      .from("whatsapp_conversations")
      .select("client_id, contact_name, lead_status, sentiment, urgency, last_message_at, is_read, status")
      .gte("started_at", since),
    supabase.from("pipeline_leads").select("business_name, stage, plan_value, score, next_action, updated_at"),
    supabase.from("leads").select("nome, source, created_at").gte("created_at", since),
    supabase
      .from("instagram_metrics")
      .select("client_id, date, followers_count, followers_gained, reach, engagement_rate")
      .gte("date", sinceDate),
    supabase
      .from("ad_metrics")
      .select("client_id, date, spend, impressions, clicks, messages_started, cost_per_message, conversions")
      .gte("date", sinceDate),
    supabase
      .from("post_metrics")
      .select("client_id, post_type, script_structure, reach, likes, comments, saves")
      .gte("posted_at", since),
  ]);

  return {
    hoje: new Date().toISOString().slice(0, 10),
    clientes: clients.data ?? [],
    conversas_30d: convos.data ?? [],
    pipeline: pipeline.data ?? [],
    leads_30d: leads.data ?? [],
    instagram_30d: ig.data ?? [],
    anuncios_30d: ads.data ?? [],
    posts_30d: posts.data ?? [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ erro: "LOVABLE_API_KEY não configurada" }, 500);

    const body = await req.json().catch(() => ({}));
    const mode: string = body?.mode ?? "briefing";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const snapshot = await buildSnapshot(supabase);

    if (mode === "chat") {
      const messages: { role: string; content: string }[] = Array.isArray(body?.messages)
        ? body.messages.slice(-12)
        : [];
      if (messages.length === 0) return json({ erro: "messages é obrigatório" }, 400);

      const input = [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text:
                "És o Altus Intelligence, o copiloto operacional de uma agência de marketing digital em Portugal. " +
                "Respondes SEMPRE em português de Portugal, de forma direta, curta e acionável. " +
                "Usa apenas os dados do snapshot. Se não houver dados, di-lo claramente e sugere o que ligar. " +
                "Nunca inventes números. Termina sempre com a próxima ação concreta.\n\nSNAPSHOT:\n" +
                JSON.stringify(snapshot).slice(0, 120000),
            },
          ],
        },
        ...messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: [
            {
              type: m.role === "assistant" ? "output_text" : "input_text",
              text: String(m.content ?? ""),
            },
          ],
        })),
      ];

      const text = await callLovableAI(apiKey, input);
      return json({ reply: text || "Sem resposta do modelo. Tenta novamente." });
    }

    const prompt = [
      {
        role: "developer",
        content: [
          {
            type: "input_text",
            text:
              "És o Altus Intelligence. Analisa o snapshot operacional da agência e devolve um briefing do dia " +
              "em português de Portugal. O headline deve ser uma frase curta com o número de oportunidades/ações de hoje. " +
              "Entre 3 e 7 sinais, cada um com uma ação concreta e curta (máx. 8 palavras). Baseia-te apenas em dados reais " +
              "do snapshot; se algo não tiver dados, assinala como sinal 'info' a pedir ligação da fonte.",
          },
        ],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(snapshot).slice(0, 120000) }],
      },
    ];

    const text = await callLovableAI(apiKey, prompt, {
      type: "json_schema",
      name: "briefing",
      strict: true,
      schema: BRIEFING_SCHEMA,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return json({ erro: "Resposta da IA inválida", raw: text.slice(0, 500) }, 502);
    }

    return json(parsed);
  } catch (e) {
    console.error("altus-intelligence:", e);
    return json({ erro: String((e as Error).message ?? e) }, 500);
  }
});
