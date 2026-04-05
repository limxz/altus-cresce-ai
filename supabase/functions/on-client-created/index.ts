import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { business_name, contact_name, contact_email, login_email, login_password, plan } = body;

    if (!contact_email) {
      return new Response(
        JSON.stringify({ error: "contact_email é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY não configurada nos Supabase Secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const planLabels: Record<string, string> = {
      starter: "Starter — €297/mês",
      growth: "Growth — €497/mês",
      pro: "Pro — €797/mês",
    };
    const planLabel = planLabels[plan] || plan;

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao Altus Media</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0f1a;font-family:'Segoe UI',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:800;letter-spacing:0.08em;color:#7B2FFF;">ALTUS MEDIA</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#13162a;border-radius:16px;border:1px solid #1e2240;padding:40px 36px;">
              <p style="font-size:18px;font-weight:600;color:#ffffff;margin:0 0 8px;">Olá ${contact_name}! 👋</p>
              <p style="font-size:15px;color:#a0a8c0;margin:0 0 28px;line-height:1.6;">
                O teu portal Altus Media está pronto. Acompanha todos os resultados do teu negócio em tempo real.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f1a;border-radius:12px;border:1px solid #1e2240;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#7B2FFF;text-transform:uppercase;margin:0 0 14px;">Os teus acessos</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#a0a8c0;width:90px;">Negócio</td>
                        <td style="padding:6px 0;font-size:13px;color:#ffffff;font-weight:500;">${business_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#a0a8c0;">Plano</td>
                        <td style="padding:6px 0;font-size:13px;color:#7B2FFF;font-weight:600;">${planLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#a0a8c0;">Email</td>
                        <td style="padding:6px 0;font-size:13px;color:#ffffff;font-weight:500;">${login_email}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#a0a8c0;">Password</td>
                        <td style="padding:6px 0;font-size:13px;color:#ffffff;font-weight:500;font-family:monospace;">${login_password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://altusmedia.pt/clientes"
                       style="display:inline-block;background-color:#7B2FFF;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                      Aceder ao meu portal →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#4a5070;margin:28px 0 0;text-align:center;line-height:1.6;">
                Dúvidas? Responde a este email ou contacta admin@altusmedia.pt
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="font-size:12px;color:#2e3350;margin:0;">
                © 2025 Altus Media · <a href="https://altusmedia.pt" style="color:#4a3070;text-decoration:none;">altusmedia.pt</a> · Braga, Portugal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Altus Media <onboarding@resend.dev>",
        to: [contact_email],
        subject: "Bem-vindo ao portal Altus Media 🚀",
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: "Resend falhou: " + JSON.stringify(resendData) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro geral:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
