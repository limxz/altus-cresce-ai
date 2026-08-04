import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECOMMENDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["alta", "media", "baixa"] },
          category: { type: "string", enum: ["conteudo", "ads", "timing"] },
        },
        required: ["title", "description", "priority", "category"],
      },
    },
  },
  required: ["summary", "recommendations"],
};

/** Streams /v1/responses and returns the accumulated output text. */
async function callLovableAI(apiKey: string, prompt: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      input: prompt,
      stream: true,
      reasoning: { effort: "medium", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: "recomendacoes",
          strict: true,
          schema: RECOMMENDATION_SCHEMA,
        },
      },
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
        // ignore partial/non-JSON SSE frames
      }
    }
  }

  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ erro: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body?.client_id;
    if (!client_id || typeof client_id !== "string") {
      return new Response(JSON.stringify({ erro: "client_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    const period_end = end.toISOString().split("T")[0];
    const period_start = start.toISOString().split("T")[0];

    const [clientRes, igRes, postRes, adRes] = await Promise.all([
      supabase.from("clients").select("id, business_name, niche, industry, instagram_handle").eq("id", client_id).maybeSingle(),
      supabase.from("instagram_metrics").select("*").eq("client_id", client_id).gte("date", period_start).lte("date", period_end).order("date", { ascending: true }),
      supabase.from("post_metrics").select("*").eq("client_id", client_id).gte("posted_at", start.toISOString()).order("posted_at", { ascending: true }),
      supabase.from("ad_metrics").select("*").eq("client_id", client_id).gte("date", period_start).lte("date", period_end).order("date", { ascending: true }),
    ]);

    if (!clientRes.data) {
      return new Response(JSON.stringify({ erro: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ig = igRes.data ?? [];
    const posts = postRes.data ?? [];
    const ads = adRes.data ?? [];

    const num = (v: unknown) => Number(v ?? 0);
    const sum = (arr: any[], k: string) => arr.reduce((s, r) => s + num(r[k]), 0);

    const totalSpend = sum(ads, "spend");
    const totalConversions = sum(ads, "conversions");
    const totalMessages = sum(ads, "messages_started");

    const dados = {
      cliente: {
        nome: clientRes.data.business_name,
        setor: clientRes.data.industry ?? clientRes.data.niche,
        instagram: clientRes.data.instagram_handle,
      },
      periodo: { inicio: period_start, fim: period_end },
      instagram: {
        dias_com_dados: ig.length,
        seguidores_inicio: ig[0]?.followers_count ?? null,
        seguidores_fim: ig[ig.length - 1]?.followers_count ?? null,
        seguidores_ganhos: sum(ig, "followers_gained"),
        alcance_total: sum(ig, "reach"),
        visitas_perfil: sum(ig, "profile_visits"),
        cliques_site: sum(ig, "website_clicks"),
        engagement_rate_medio: ig.length
          ? Number((sum(ig, "engagement_rate") / ig.length).toFixed(2))
          : null,
        serie_diaria: ig.map((r) => ({
          date: r.date,
          followers: r.followers_count,
          reach: r.reach,
          engagement_rate: r.engagement_rate,
        })),
      },
      posts: {
        total: posts.length,
        por_tipo: posts.reduce((acc: Record<string, number>, p) => {
          const k = p.post_type ?? "desconhecido";
          acc[k] = (acc[k] ?? 0) + 1;
          return acc;
        }, {}),
        detalhe: posts.map((p) => ({
          tipo: p.post_type,
          publicado_em: p.posted_at,
          estrutura: p.script_structure,
          reach: p.reach,
          likes: p.likes,
          comments: p.comments,
          saves: p.saves,
          shares: p.shares,
        })),
      },
      ads: {
        investimento_total: Number(totalSpend.toFixed(2)),
        impressoes: sum(ads, "impressions"),
        cliques: sum(ads, "clicks"),
        mensagens_iniciadas: totalMessages,
        conversoes: totalConversions,
        custo_por_mensagem: totalMessages > 0 ? Number((totalSpend / totalMessages).toFixed(2)) : null,
        custo_por_conversao: totalConversions > 0 ? Number((totalSpend / totalConversions).toFixed(2)) : null,
        serie_diaria: ads.map((r) => ({
          date: r.date,
          spend: r.spend,
          clicks: r.clicks,
          messages_started: r.messages_started,
          conversions: r.conversions,
        })),
      },
    };

    const prompt = [
      "És um estratega sénior de marketing digital para negócios locais em Portugal.",
      "Analisa os dados reais dos últimos 30 dias deste cliente e devolve entre 3 e 5 recomendações accionáveis e específicas.",
      "Regras: escreve em português de Portugal; cada recomendação deve referir números concretos dos dados; nada de conselhos genéricos.",
      "O campo 'title' tem no máximo 70 caracteres e 'description' no máximo 500 caracteres.",
      "'summary' é um parágrafo curto com o estado geral da conta.",
      "",
      "DADOS (JSON):",
      JSON.stringify(dados),
    ].join("\n");

    const raw = await callLovableAI(apiKey, prompt);
    if (!raw) throw new Error("A IA devolveu resposta vazia");

    let parsed: { summary: string; recommendations: any[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`Resposta da IA não é JSON: ${raw.slice(0, 300)}`);
      parsed = JSON.parse(match[0]);
    }

    const recommendations = (parsed.recommendations ?? []).slice(0, 5);

    const { data: saved, error: saveError } = await supabase
      .from("ai_recommendations")
      .insert({
        client_id,
        period_start,
        period_end,
        summary: parsed.summary ?? null,
        recommendations,
      })
      .select()
      .single();

    if (saveError) throw new Error(`Falha ao guardar recomendações: ${saveError.message}`);

    console.log(`Geradas ${recommendations.length} recomendações para ${clientRes.data.business_name}`);

    return new Response(JSON.stringify({ sucesso: true, recomendacao: saved }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Erro em generate-recommendations:", e);
    return new Response(JSON.stringify({ erro: "Erro interno", detalhe: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
