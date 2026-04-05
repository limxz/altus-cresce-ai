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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { client_id } = body;

    if (!client_id) {
      return new Response(
        JSON.stringify({ erro: "client_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agora = new Date();
    const month: number = body.month ?? agora.getMonth() + 1;
    const year: number = body.year ?? agora.getFullYear();

    console.log(`A gerar relatório para cliente ${client_id} — ${month}/${year}`);

    // Dados do cliente
    const { data: cliente, error: erroCliente } = await supabase
      .from("clients")
      .select("id, business_name, mrr, instagram_baseline, niche")
      .eq("id", client_id)
      .single();

    if (erroCliente || !cliente) {
      return new Response(
        JSON.stringify({ erro: "Cliente não encontrado", detalhe: erroCliente?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Métricas do mês
    const inicioMes = new Date(year, month - 1, 1).toISOString();
    const fimMes = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: metricas } = await supabase
      .from("metrics")
      .select("instagram_followers, leads_count, bot_conversations, posts_published")
      .eq("client_id", client_id)
      .gte("date", inicioMes.split("T")[0])
      .lte("date", fimMes.split("T")[0])
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Conversas WhatsApp quentes do mês
    const { count: conversasQuentes } = await supabase
      .from("whatsapp_conversations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client_id)
      .in("lead_status", ["interessado", "marcou_consulta"])
      .gte("started_at", inicioMes)
      .lte("started_at", fimMes);

    // Calcular valores
    const leads_generated = metricas?.leads_count ?? 0;
    const conversations_handled = metricas?.bot_conversations ?? (conversasQuentes ?? 0);
    const posts_published = metricas?.posts_published ?? 0;
    const seguidoresActuais = metricas?.instagram_followers ?? 0;
    const followers_gained = Math.max(0, seguidoresActuais - (cliente.instagram_baseline ?? 0));
    const estimated_revenue = parseFloat((leads_generated * 150 * 0.15).toFixed(2));
    const mrr = cliente.mrr ?? 0;
    const roi_ratio = mrr > 0 ? parseFloat((estimated_revenue / mrr).toFixed(2)) : 0;

    console.log(`leads=${leads_generated}, conversas=${conversations_handled}, posts=${posts_published}, seguidores_ganhos=${followers_gained}, receita=€${estimated_revenue}, roi=${roi_ratio}x`);

    // Upsert relatório
    const { data: relatorio, error: erroUpsert } = await supabase
      .from("client_reports")
      .upsert(
        { client_id, month, year, leads_generated, conversations_handled, posts_published, followers_gained, estimated_revenue, roi_ratio },
        { onConflict: "client_id,month,year" }
      )
      .select()
      .single();

    if (erroUpsert) {
      return new Response(
        JSON.stringify({ erro: "Falha ao guardar relatório", detalhe: erroUpsert.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        relatorio: {
          ...relatorio,
          cliente: { id: cliente.id, business_name: cliente.business_name, niche: cliente.niche, mrr: cliente.mrr },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Erro inesperado:", e);
    return new Response(
      JSON.stringify({ erro: "Erro interno do servidor", detalhe: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
