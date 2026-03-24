import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_name, business_type, city, url, instagram } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `És um auditor de marketing digital português especializado em negócios locais. Analisa o perfil de Instagram e presença online do negócio de forma realista e crítica. Responde APENAS com JSON válido, sem markdown nem backticks.

REGRAS DE PONTUAÇÃO OBRIGATÓRIAS:
- A pontuação geral NUNCA pode ser superior a 79. Máximo absoluto: 79.
- Cada categoria NUNCA pode ter mais de 79 pontos.
- A maioria dos negócios locais tem pontuações entre 15 e 55.
- Sê honesto e crítico — isto é para ajudar o negócio a melhorar.
- Analisa o Instagram (${instagram || "não fornecido"}) com base em: frequência de publicações, qualidade visual, engagement, bio, highlights, CTAs, hashtags, stories.
- Se tiverem site, analisa também: velocidade, SEO, mobile, CTAs.`
          },
          {
            role: "user",
            content: `Faz uma auditoria completa deste negócio:
- Nome: "${business_name}"
- Tipo: "${business_type}"  
- Cidade: "${city || "Braga"}"
- Instagram: "${instagram || "não fornecido"}"
- Site: "${url || "não fornecido"}"

Responde com este JSON exacto (pontuações realistas, NUNCA acima de 79):
{
  "score": 42,
  "score_label": "Precisa de Atenção",
  "categories": [
    {"name": "Instagram & Redes Sociais", "score": 35, "issues": ["problema real 1", "problema real 2", "problema real 3"], "opportunities": ["oportunidade 1", "oportunidade 2"]},
    {"name": "Presença Digital & SEO", "score": 40, "issues": ["problema real 1", "problema real 2"], "opportunities": ["oportunidade 1", "oportunidade 2"]},
    {"name": "Captação de Clientes", "score": 25, "issues": ["problema real 1", "problema real 2"], "opportunities": ["oportunidade 1", "oportunidade 2"]},
    {"name": "Competitividade Local", "score": 50, "issues": ["problema real 1", "problema real 2"], "opportunities": ["oportunidade 1", "oportunidade 2"]}
  ],
  "estimated_monthly_loss": 1500,
  "top_recommendation": "recomendação personalizada e específica",
  "quick_wins": ["vitória rápida 1", "vitória rápida 2", "vitória rápida 3"]
}

Personaliza TUDO para este negócio. Menciona o Instagram ${instagram} especificamente nos problemas e oportunidades. Sê genuíno, crítico e útil.`
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiados pedidos. Tenta novamente em breve." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const audit = JSON.parse(cleaned);

    return new Response(JSON.stringify({ audit }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Audit error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
