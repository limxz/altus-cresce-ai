import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { businessName, businessType, problems, revenue } = await req.json();
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
            content: "És consultor sénior de automação de marketing em Portugal. Cria planos personalizados em português de Portugal. Responde APENAS com o plano, sem introdução ou conclusão."
          },
          {
            role: "user",
            content: `Negócio: "${businessName}". Tipo: "${businessType}". Problemas: ${(problems || []).join(", ")}. Faturação: "${revenue}".

Cria um plano com:
- 3 automações específicas para este tipo de negócio, cada uma com: nome, descrição, ROI estimado por mês, tempo de implementação
- 1 dado surpreendente sobre o mercado português deste sector
- 3 próximos passos accionáveis que podem começar ESTA semana

Formato: claro, directo, com números concretos. Linguagem simples, sem jargão técnico.`
          }
        ],
        max_tokens: 800,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    const plan = data.choices?.[0]?.message?.content || "Plano não disponível.";

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Plan error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
