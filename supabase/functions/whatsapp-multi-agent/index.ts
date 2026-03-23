import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a test request from admin UI
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return handleTestMessage(req);
  }

  // Twilio webhook — immediate TwiML response
  const twimlOk = new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } }
  );

  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const from = params.get("From") || "";
    const to = params.get("To") || "";
    const body = params.get("Body") || "";
    const profileName = params.get("ProfileName") || "";

    const phoneNumber = from.replace("whatsapp:", "");
    const twilioTo = to.replace("whatsapp:", "");

    if (!phoneNumber || !body) return twimlOk;

    // Process async — respond immediately to Twilio
    processMessage(phoneNumber, twilioTo, body, profileName).catch(console.error);

    return twimlOk;
  } catch (e) {
    console.error("Webhook error:", e);
    return twimlOk;
  }
});

async function handleTestMessage(req: Request) {
  try {
    const { agent_id, message } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: agent } = await supabase
      .from("whatsapp_agents")
      .select("*, clients(*)")
      .eq("id", agent_id)
      .single();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(agent, "Utilizador de teste");

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 400,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ reply: "Erro ao contactar a IA. Tenta novamente." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "Sem resposta da IA.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Test error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

async function processMessage(
  phoneNumber: string,
  twilioToNumber: string,
  messageBody: string,
  profileName: string
) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Find agent by Twilio number
  const { data: agent } = await supabase
    .from("whatsapp_agents")
    .select("*, clients(*)")
    .eq("twilio_number", twilioToNumber)
    .eq("is_active", true)
    .single();

  if (!agent) {
    console.error("No active agent for number:", twilioToNumber);
    return;
  }

  // 2. Find or create conversation
  let { data: conversation } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("agent_id", agent.id)
    .eq("contact_phone", phoneNumber)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  const isNewConversation = !conversation;

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("whatsapp_conversations")
      .insert({
        client_id: agent.client_id,
        agent_id: agent.id,
        contact_phone: phoneNumber,
        contact_name: profileName || null,
        first_message: messageBody,
        last_message: messageBody,
        messages_count: 1,
      })
      .select()
      .single();
    conversation = newConv;
  }

  if (!conversation) {
    console.error("Failed to create conversation");
    return;
  }

  // 3. Save user message
  await supabase.from("whatsapp_messages").insert({
    conversation_id: conversation.id,
    client_id: agent.client_id,
    sender: "user",
    content: messageBody,
  });

  // 4. Load conversation history
  const { data: stateData } = await supabase
    .from("whatsapp_conversation_state")
    .select("history")
    .eq("agent_id", agent.id)
    .eq("phone_number", phoneNumber)
    .single();

  const history = (stateData?.history as any[]) || [];
  history.push({ role: "user", content: messageBody });
  const recentHistory = history.slice(-12);

  // 5. Build system prompt
  const systemPrompt = buildSystemPrompt(agent, profileName);

  // 6. Call AI
  const aiResponse = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentHistory,
        ],
        max_tokens: 400,
      }),
    }
  );

  let reply = "Peço desculpa, tive um problema técnico. Tente de novo.";
  if (aiResponse.ok) {
    const aiData = await aiResponse.json();
    reply = aiData.choices?.[0]?.message?.content || reply;
  } else {
    console.error("AI error:", aiResponse.status, await aiResponse.text());
  }

  // 7. Save bot reply
  await supabase.from("whatsapp_messages").insert({
    conversation_id: conversation.id,
    client_id: agent.client_id,
    sender: "bot",
    content: reply,
  });

  // 8. Update conversation
  await supabase
    .from("whatsapp_conversations")
    .update({
      last_message: reply,
      last_message_at: new Date().toISOString(),
      messages_count: (conversation.messages_count || 0) + 2,
      contact_name: profileName || conversation.contact_name,
      is_read: false,
    })
    .eq("id", conversation.id);

  // 9. Update conversation state
  recentHistory.push({ role: "assistant", content: reply });
  await supabase.from("whatsapp_conversation_state").upsert({
    agent_id: agent.id,
    phone_number: phoneNumber,
    history: recentHistory,
    last_updated: new Date().toISOString(),
  });

  // 10. Update agent stats
  await supabase
    .from("whatsapp_agents")
    .update({
      total_messages: (agent.total_messages || 0) + 2,
      total_conversations: isNewConversation
        ? (agent.total_conversations || 0) + 1
        : agent.total_conversations,
    })
    .eq("id", agent.id);

  // 11. Classify every 3 messages or new conversation
  if ((conversation.messages_count || 0) % 3 === 0 || isNewConversation) {
    classifyConversation(supabase, conversation.id, recentHistory).catch(
      console.error
    );
  }

  // 12. Send reply via Twilio
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (twilioSid && twilioToken) {
    const twilioResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${twilioToNumber}`,
          To: `whatsapp:${phoneNumber}`,
          Body: reply,
        }),
      }
    );
    if (!twilioResp.ok) {
      console.error("Twilio error:", twilioResp.status, await twilioResp.text());
    }
  } else {
    console.warn("Twilio credentials not configured — reply not sent via WhatsApp");
  }
}

function buildSystemPrompt(agent: any, profileName: string): string {
  const client = agent.clients;
  return `
És o ${agent.agent_name}, assistente virtual do negócio "${client?.business_name || "o negócio"}" em Portugal.

${agent.business_description || ""}

SERVIÇOS E INFORMAÇÕES:
${agent.services_info || "Informações não configuradas."}

HORÁRIO: ${agent.working_hours || "Seg-Sex 09h-18h"}

${agent.booking_link ? `LINK DE MARCAÇÕES: ${agent.booking_link}` : ""}

REGRAS:
- Fala SEMPRE em português de Portugal
- Mensagens curtas — máximo 3 frases
- Tom: profissional, caloroso, directo
- Nunca inventar informação que não tens
- Se não souberes algo: "Vou verificar com a equipa e respondo em breve."
- Sempre oferece ajuda adicional no final
- Se o cliente quiser marcar ou mostrar interesse: oferece o link de agendamento imediatamente
${profileName ? `- O cliente chama-se ${profileName}` : ""}

${agent.system_prompt || ""}
`.trim();
}

async function classifyConversation(
  supabase: any,
  conversationId: string,
  history: any[]
) {
  const classificationPrompt = `
Analisa esta conversa de WhatsApp e classifica em JSON.
Responde APENAS com JSON válido, sem markdown nem backticks.

Conversa:
${history.map((m) => `${m.role === "user" ? "Cliente" : "Bot"}: ${m.content}`).join("\n")}

Responde com este JSON exacto:
{
  "lead_status": "novo|interessado|marcou_consulta|cliente|perdido",
  "contact_type": "novo_contacto|cliente_antigo|referido|recontacto",
  "urgency": "urgente|normal|baixa",
  "primary_need": "descrição curta da necessidade principal",
  "sentiment": "positivo|neutro|negativo",
  "tags": ["tag1", "tag2"],
  "classification_summary": "1 frase resumindo a conversa"
}

Tags possíveis: brasileiro, portugues, estrangeiro, estudante, empresario, familiar, urgente, sem_interesse, preco, informacao, marcacao, reclamacao, agradecimento
`;

  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: classificationPrompt }],
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) return;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const classification = JSON.parse(cleaned);

    await supabase
      .from("whatsapp_conversations")
      .update(classification)
      .eq("id", conversationId);
  } catch (e) {
    console.error("Classification error:", e);
  }
}
