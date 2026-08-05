import { admin, audit, corsHeaders, json, notify } from "../_shared/os.ts";

const sha256 = async (value: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const clean = (v: unknown, max = 200) => {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const token = clean(body.token, 200);
  if (!token) return json({ error: "token em falta" }, 400);

  const { data: tokenRow } = await admin
    .from("client_webhook_tokens")
    .select("id, client_id, organization_id, revoked_at")
    .eq("token_hash", await sha256(token))
    .maybeSingle();

  if (!tokenRow || tokenRow.revoked_at) return json({ error: "Token inválido" }, 401);

  const name = clean(body.name, 120);
  const email = clean(body.email, 255)?.toLowerCase() ?? null;
  const phone = clean(body.phone, 40);
  const source = clean(body.source, 60) ?? "external";
  const occurredRaw = clean(body.occurred_at, 40);
  const occurred = occurredRaw && !Number.isNaN(Date.parse(occurredRaw))
    ? new Date(occurredRaw).toISOString()
    : new Date().toISOString();
  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? (body.metadata as Record<string, unknown>)
    : {};

  const identity = email ?? phone ?? clean(body.external_id, 120);
  const dedupe = identity ? `${source}:${identity}:${occurred.slice(0, 10)}` : null;

  const { data: inserted, error } = await admin
    .from("external_signups")
    .upsert(
      {
        organization_id: tokenRow.organization_id,
        client_id: tokenRow.client_id,
        source,
        name,
        email,
        phone,
        occurred_at: occurred,
        metadata,
        dedupe_key: dedupe,
      },
      { onConflict: "client_id,dedupe_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("external signup insert failed", error.message);
    await audit({
      organization_id: tokenRow.organization_id,
      client_id: tokenRow.client_id,
      action_type: "external_signup",
      provider: source,
      status: "error",
      title: "Falha ao registar inscrição externa",
      detail: error.message,
    });
    return json({ error: "Não foi possível registar a inscrição" }, 500);
  }

  await admin
    .from("client_webhook_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  if (!inserted) return json({ ok: true, duplicate: true });

  await audit({
    organization_id: tokenRow.organization_id,
    client_id: tokenRow.client_id,
    action_type: "external_signup",
    provider: source,
    status: "success",
    title: `Nova inscrição via ${source}`,
    detail: name ?? email ?? phone ?? null,
    metadata: { signup_id: inserted.id },
  });

  await notify({
    organization_id: tokenRow.organization_id,
    client_id: tokenRow.client_id,
    category: "lead",
    severity: "oportunidade",
    title: "Nova inscrição recebida",
    detail: [name, email, phone].filter(Boolean).join(" · ") || `Origem: ${source}`,
    href: `/admin/client/${tokenRow.client_id}`,
    dedupe_key: `signup:${inserted.id}`,
  });

  return json({ ok: true, id: inserted.id });
});
