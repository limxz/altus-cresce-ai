import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { phone, message, client_id, contact_name } = body;

    if (!phone || !message || !client_id) {
      return new Response(
        JSON.stringify({ erro: "phone, message e client_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Mensagem recebida de ${phone} para cliente ${client_id}: "${message}"`);

    // Verificar se já existe conversa com este número
    const { data: conversaExistente } = await supabase
      .from("whatsapp_conversations")
      .select("id, messages_count, first_message")
      .eq("client_id", client_id)
      .eq("contact_phone", phone)
      .single();

    let conversaId: string;

    if (conversaExistente) {
      // Actualizar conversa existente
      conversaId = conversaExistente.id;
      await supabase
        .from("whatsapp_conversations")
        .update({
          last_message: message,
          last_message_at: new Date().toISOString(),
          is_read: false,
          messages_count: (conversaExistente.messages_count || 0) + 1,
          ...(contact_name ? { contact_name } : {}),
        } as any)
        .eq("id", conversaId);
    } else {
      // Criar nova conversa
      const { data: novaConversa, error: erroConversa } = await supabase
        .from("whatsapp_conversations")
        .insert({
          client_id,
          contact_phone: phone,
          contact_name: contact_name || null,
          first_message: message,
          last_message: message,
          last_message_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          lead_status: "novo",
          urgency: "normal",
          is_read: false,
          messages_count: 1,
          tags: [],
        } as any)
        .select("id")
        .single();

      if (erroConversa || !novaConversa) {
        console.error("Erro ao criar conversa:", erroConversa);
        return new Response(
          JSON.stringify({ erro: "Falha ao criar conversa", detalhe: erroConversa?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      conversaId = (novaConversa as any).id;
    }

    // Guardar mensagem
    await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversaId,
        client_id,
        sender: "user",
        content: message,
        timestamp: new Date().toISOString(),
      } as any);

    // Ir buscar histórico recente para contexto
    const { data: historico } = await supabase
      .from("whatsapp_messages")
      .select("sender, content")
      .eq("conversation_id", conversaId)
      .order("timestamp", { ascending: false })
      .limit(5);

    const historicoTexto = historico
      ? historico
          .reverse()
          .map((m: any) => `${m.sender === "user" ? "Cliente" : "Bot"}: ${m.content}`)
          .join("\n")
      : "Sem histórico";

    // Ir buscar info do cliente para contexto do negócio
    const { data: clienteInfo } = await supabase
      .from("clients")
      .select("business_name, niche")
      .eq("id", client_id)
      .single();

    const tipoNegocio = clienteInfo?.business_name
      ? `${clienteInfo.business_name} (${clienteInfo.niche || "negócio local"})`
      : "negócio local em Portugal";

    // Classificar com Claude Haiku
    let classificacao: any = null;
    try {
      const resposta = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `És um especialista em análise de leads para negócios locais em Portugal.

Negócio: ${tipoNegocio}
Mensagem do cliente: ${message}
Histórico da conversa: ${historicoTexto}

Analisa e responde APENAS com JSON válido (sem markdown, sem texto adicional):
{
  "lead_status": "novo" ou "interessado" ou "marcou_consulta" ou "cliente" ou "perdido",
  "urgency": "urgente" ou "normal" ou "baixa",
  "primary_need": "descrição curta em português do que o cliente precisa",
  "sentiment": "positivo" ou "neutro" ou "negativo",
  "conversion_score": número de 0 a 100,
  "classification_summary": "1 frase em português resumindo o lead",
  "tags": ["tag1", "tag2"]
}

Critérios para lead_status:
- "interessado": pergunta sobre preços, disponibilidade, serviços específicos
- "marcou_consulta": quer marcar, agenda, reserva, consulta
- "urgente": menciona hoje, urgente, imediatamente, o mais rápido possível
- "novo": primeira mensagem genérica, saudação, info geral
- "perdido": desinteresse, cancelamento, reclamação grave

Contexto português: usa "marcação" não "agendamento", "telemóvel" não "celular".`,
          },
        ],
      });

      const textoResposta = resposta.content[0].type === "text" ? resposta.content[0].text : "";

      // Tentar extrair JSON da resposta
      const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        classificacao = JSON.parse(jsonMatch[0]);
        console.log(`Classificação: status=${classificacao.lead_status}, score=${classificacao.conversion_score}, urgência=${classificacao.urgency}`);
      }
    } catch (erroIA) {
      console.error("Erro na classificação IA (não fatal):", erroIA);
      // Continua sem classificação — não bloqueia
    }

    // Actualizar conversa com classificação (se obtida)
    if (classificacao) {
      const urgency = classificacao.conversion_score > 75 ? "urgente" : (classificacao.urgency || "normal");

      await supabase
        .from("whatsapp_conversations")
        .update({
          lead_status: classificacao.lead_status || "novo",
          urgency,
          primary_need: classificacao.primary_need || null,
          sentiment: classificacao.sentiment || "neutro",
          classification_summary: classificacao.classification_summary || null,
          tags: classificacao.tags || [],
        } as any)
        .eq("id", conversaId);
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        conversa_id: conversaId,
        classificacao: classificacao || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Erro no webhook WhatsApp:", e);
    return new Response(
      JSON.stringify({ erro: "Erro interno do servidor", detalhe: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
