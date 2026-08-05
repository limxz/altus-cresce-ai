import { admin, audit, corsHeaders, json } from "../_shared/os.ts";

const csvEscape = (v: unknown) => {
  const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toCsv(rows: any[], columns: string[]) {
  const head = columns.join(",");
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

async function sendMail(to: string[], subject: string, html: string, csv: string, filename: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY não configurada.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Altus Media <suporte@altusmedia.pt>",
      to,
      subject,
      html,
      attachments: [{ filename, content: btoa(unescape(encodeURIComponent(csv))) }],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Resend [${res.status}] ${text.slice(0, 300)}`);
  return text;
}

async function runExport(setting: any, force = false) {
  const now = new Date();
  const windowDays = setting.frequency === "weekly" ? 7 : 1;

  if (!force) {
    if (!setting.enabled) return { skipped: "desativado" };
    if (now.getUTCHours() < (setting.send_hour_utc ?? 6)) return { skipped: "fora de hora" };
    if (setting.frequency === "weekly" && now.getUTCDay() !== 1) return { skipped: "não é segunda-feira" };
    if (setting.last_sent_at) {
      const hours = (now.getTime() - new Date(setting.last_sent_at).getTime()) / 36e5;
      if (hours < windowDays * 24 - 2) return { skipped: "já enviado neste período" };
    }
  }

  const recipients: string[] = (setting.recipients ?? []).filter(Boolean);
  if (!recipients.length) return { skipped: "sem destinatários" };

  const since = new Date(now.getTime() - windowDays * 864e5).toISOString();

  const [{ data: logs }, { data: clients }] = await Promise.all([
    admin
      .from("audit_log")
      .select("*")
      .eq("organization_id", setting.organization_id)
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    admin.from("clients").select("id, business_name").eq("organization_id", setting.organization_id),
  ]);

  const names = new Map((clients ?? []).map((c: any) => [c.id, c.business_name]));
  const rows = (logs ?? []).map((l: any) => ({
    data: l.created_at,
    cliente: l.client_id ? names.get(l.client_id) ?? l.client_id : "—",
    tipo: l.action_type,
    provider: l.provider ?? "",
    estado: l.status,
    ator: l.actor,
    titulo: l.title,
    detalhe: l.detail ?? "",
    duracao_ms: l.duration_ms ?? "",
    metadata: l.metadata ?? {},
  }));

  const csv = toCsv(rows, [
    "data", "cliente", "tipo", "provider", "estado", "ator", "titulo", "detalhe", "duracao_ms", "metadata",
  ]);

  const errors = rows.filter((r) => r.estado === "error").length;
  const label = setting.frequency === "weekly" ? "semanal" : "diário";
  const filename = `auditoria-altus-${now.toISOString().slice(0, 10)}.csv`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#111">
      <h2 style="margin:0 0 8px">Relatório de auditoria ${label}</h2>
      <p style="margin:0 0 12px;color:#555">Período: últimos ${windowDays} dia(s) · ${rows.length} registos · ${errors} falha(s).</p>
      <p style="margin:0;color:#555">O ficheiro CSV completo segue em anexo.</p>
    </div>`;

  await sendMail(recipients, `Auditoria Altus (${label}) — ${rows.length} registos`, html, csv, filename);

  await admin
    .from("audit_export_settings")
    .update({ last_sent_at: now.toISOString(), last_status: "success", last_error: null })
    .eq("id", setting.id);

  await audit({
    organization_id: setting.organization_id,
    action_type: "audit_export",
    status: "success",
    title: `Exportação ${label} da auditoria enviada`,
    detail: `${rows.length} registos para ${recipients.join(", ")}`,
    metadata: { rows: rows.length, errors, recipients },
  });

  return { sent: true, rows: rows.length, recipients };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: any = {};
  try {
    body = await req.json();
  } catch { /* cron sends empty body */ }

  const query = admin.from("audit_export_settings").select("*");
  if (body.organization_id) query.eq("organization_id", body.organization_id);

  const { data: settings, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const results: any[] = [];
  for (const s of settings ?? []) {
    try {
      results.push({ organization_id: s.organization_id, ...(await runExport(s, !!body.force)) });
    } catch (e) {
      const message = (e as Error).message;
      console.error("audit export failed", message);
      await admin
        .from("audit_export_settings")
        .update({ last_status: "error", last_error: message })
        .eq("id", s.id);
      results.push({ organization_id: s.organization_id, error: message });
    }
  }

  return json({ processed: results.length, results });
});
