import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `És um consultor especialista em marketing digital e automação de negócios a trabalhar para a Altus Media, uma agência portuguesa especializada em automação com IA, agentes de WhatsApp, recepcionistas de voz com IA, criação de sites e gestão de anúncios no Facebook e Instagram.

O utilizador submeteu o seu perfil de Instagram e opcionalmente o seu site para análise. Com base nos URLs e no setor fornecido, faz um diagnóstico detalhado em português de Portugal da presença digital do negócio.

Responde APENAS com um objeto JSON válido, sem texto antes ou depois, com esta estrutura exata:
{
  "score": <número 0-100>,
  "nome_negocio": "<nome inferido do URL ou 'O teu negócio'>",
  "presenca_online": {
    "nota": <1-5>,
    "analise": "<2-3 frases sobre presença online, bio, consistência>",
    "melhoria": "<1 sugestão concreta de melhoria>"
  },
  "comunicacao_conteudo": {
    "nota": <1-5>,
    "analise": "<2-3 frases sobre estratégia de conteúdo, frequência, engagement>",
    "melhoria": "<1 sugestão concreta de melhoria>"
  },
  "atendimento_cliente": {
    "nota": <1-5>,
    "analise": "<2-3 frases sobre como gerem o contacto com clientes, velocidade de resposta, presença no WhatsApp>",
    "melhoria": "<1 sugestão que aponte naturalmente para agentes de WhatsApp com IA e recepcionistas de voz>"
  },
  "publicidade": {
    "nota": <1-5>,
    "analise": "<2-3 frases sobre presença em publicidade paga ou falta dela>",
    "melhoria": "<1 sugestão que aponte naturalmente para gestão de anúncios no Facebook e Instagram>"
  },
  "site_conversao": {
    "nota": <1-5>,
    "analise": "<2-3 frases sobre qualidade do site, velocidade, elementos de conversão — se não tiver site, menciona a oportunidade perdida>",
    "melhoria": "<1 sugestão que aponte naturalmente para criação de site profissional>"
  },
  "conclusao": "<3-4 frases que resumem as maiores oportunidades, são encorajadoras mas honestas, e terminam com um call to action natural mencionando que a Altus Media oferece uma consulta gratuita de 30 minutos para implementar estas melhorias>",
  "top_3_prioridades": ["<prioridade 1>", "<prioridade 2>", "<prioridade 3>"]
}

Sê específico, perspicaz e genuinamente útil. As sugestões de melhoria devem sentir-se naturais — não como publicidade forçada. O objetivo é dar valor real enquanto posicionas os serviços da Altus Media como a solução óbvia.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { setor, instagram_url, site_url } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessage = `Setor: ${setor}\nInstagram: ${instagram_url}\nSite: ${site_url || "Não fornecido"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tenta novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao contactar a IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const diagnostico = JSON.parse(jsonStr);

    return new Response(JSON.stringify({ diagnostico }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose-business error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
