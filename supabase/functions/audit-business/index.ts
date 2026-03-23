import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_name, business_type, city, url } = await req.json();
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
            content: `És um especialista de marketing digital português. Cria auditorias de negócios locais. Responde APENAS com JSON válido, sem markdown. Sê realista e crítico nas pontuações — a maioria dos negócios locais tem pontuações entre 20 e 55. Nunca dês mais de 70 na pontuação geral.`
          },
          {
            role: "user",
            content: `Negócio: "${business_name}", Tipo: "${business_type}", Cidade: "${city || "Braga"}", URL: "${url || "não fornecido"}".

Cria uma auditoria completa com este JSON exacto:
{
  "score": 45,
  "score_label": "Precisa de Atenção",
  "categories": [
    {"name": "Presença Digital", "score": 30, "issues": ["issue1", "issue2"], "opportunities": ["opp1", "opp2"]},
    {"name": "Redes Sociais", "score": 45, "issues": ["issue1", "issue2"], "opportunities": ["opp1", "opp2"]},
    {"name": "Captação de Clientes", "score": 25, "issues": ["issue1", "issue2"], "opportunities": ["opp1", "opp2"]},
    {"name": "Competitividade", "score": 50, "issues": ["issue1", "issue2"], "opportunities": ["opp1", "opp2"]}
  ],
  "estimated_monthly_loss": 1200,
  "top_recommendation": "...",
  "quick_wins": ["win1", "win2", "win3"]
}

Personaliza tudo para este negócio específico em ${city || "Braga"}. Sê genuíno e útil.`
          }
        ],
        max_tokens: 800,
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
