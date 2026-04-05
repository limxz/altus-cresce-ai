import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_name, contact_name, contact_email, login_email, login_password, plan } = await req.json();

    if (!contact_email || !login_email || !login_password) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios em falta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada");
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
  <title>Bem-vindo ao portal Altus Media</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0f1a;font-family:'Segoe UI',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:800;letter-spacing:0.08em;color:#7C3AED;">ALTUS MEDIA</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#13162a;border-radius:16px;border:1px solid #1e2240;padding:40px 36px;">
              <p style="font-size:18px;font-weight:600;color:#ffffff;margin:0 0 8px;">Olá ${contact_name},</p>
              <p style="font-size:15px;color:#a0a8c0;margin:0 0 28px;line-height:1.6;">
                O teu portal Altus Media está pronto. A partir de agora podes acompanhar em tempo real todas as métricas, leads e resultados do teu negócio.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0f1a;border-radius:12px;border:1px solid #1e2240;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;color:#7C3AED;text-transform:uppercase;margin:0 0 14px;">Credenciais de Acesso</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#a0a8c0;width:90px;">Negócio</td>
                        <td style="padding:6px 0;font-size:13px;color:#ffffff;font-weight:500;">${business_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#a0a8c0;">Plano</td>
                        <td style="padding:6px 0;font-size:13px;color:#7C3AED;font-weight:600;">${planLabel}</td>
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

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://altusmedia.pt/clientes"
                       style="display:inline-block;background-color:#7C3AED;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.02em;">
                      Aceder ao portal →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#4a5070;margin:28px 0 0;text-align:center;line-height:1.6;">
                Se tiveres alguma dúvida, responde a este email ou fala connosco no WhatsApp.<br/>
                Guarda esta password num local seguro.
              </p>
            </td>
          </tr>
          <!-- Footer -->
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Altus Media <portal@altusmedia.pt>",
        to: [contact_email],
        subject: "Bem-vindo ao portal Altus Media 🚀",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error: ${err}`);
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("on-client-created error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
