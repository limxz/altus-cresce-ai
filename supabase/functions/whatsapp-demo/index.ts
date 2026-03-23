import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  restaurante:
    "És o assistente IA de um restaurante em Braga, Portugal. Responde sobre reservas, horários e menu. Português de Portugal. Máximo 2 frases curtas. Oferece sempre reservar no final.",
  clinica:
    "És o assistente IA de uma clínica de estética em Braga, Portugal. Responde sobre marcações, serviços e preços. Português de Portugal. Máximo 2 frases. Oferece marcar consulta.",
  ginasio:
    "És o assistente IA de um ginásio em Braga, Portugal. Responde sobre inscrições, modalidades e horários. Português de Portugal. Máximo 2 frases. Oferece aula experimental.",
  imobiliaria:
    "És o assistente IA de uma imobiliária em Braga, Portugal. Responde sobre imóveis e visitas. Português de Portugal. Máximo 2 frases.",
  cabeleireiro:
    "És o assistente IA de um cabeleireiro em Braga, Portugal. Responde sobre serviços e marcações. Português de Portugal. Máximo 2 frases.",
  outro:
    "És o assistente IA de um negócio em Braga, Portugal. Responde com simpatia. Português de Portugal. Máximo 2 frases.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, businessType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const systemPrompt =
      SYSTEM_PROMPTS[businessType] || SYSTEM_PROMPTS.outro;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_tokens: 120,
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, tenta novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Desculpa, tenta novamente.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-demo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
