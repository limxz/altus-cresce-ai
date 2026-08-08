import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export const today = () => new Date().toISOString().slice(0, 10);

export interface NotifyInput {
  organization_id: string;
  client_id?: string | null;
  category: string;
  severity?: "critico" | "atencao" | "oportunidade" | "info";
  title: string;
  detail?: string | null;
  href?: string | null;
  dedupe_key?: string | null;
}

/** Insert a notification, ignoring duplicates protected by dedupe_key. */
export async function notify(n: NotifyInput) {
  const { error } = await admin.from("notifications").upsert(
    {
      organization_id: n.organization_id,
      client_id: n.client_id ?? null,
      category: n.category,
      severity: n.severity ?? "info",
      title: n.title,
      detail: n.detail ?? null,
      href: n.href ?? null,
      dedupe_key: n.dedupe_key ?? null,
    },
    { onConflict: "organization_id,dedupe_key", ignoreDuplicates: true },
  );
  if (error) console.error("notify failed", error.message);
  else await pushRealtime(n.client_id, "notification", { category: n.category, severity: n.severity ?? "info" });
}

/** Call another edge function with the service role key (fire and forget friendly). */
export async function invokeFunction(name: string, body: unknown) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) console.error(`invoke ${name} [${res.status}] ${text.slice(0, 300)}`);
  return { ok: res.ok, body: text };
}

export interface AuditInput {
  organization_id: string;
  client_id?: string | null;
  integration_id?: string | null;
  actor?: "system" | "user" | "ai";
  actor_id?: string | null;
  action_type: string;
  provider?: string | null;
  status?: "success" | "error" | "pending" | "skipped";
  title: string;
  detail?: string | null;
  metadata?: Record<string, unknown>;
  duration_ms?: number | null;
}

/** Append an immutable audit-log entry. Never throws. */
export async function audit(a: AuditInput) {
  const { error } = await admin.from("audit_log").insert({
    organization_id: a.organization_id,
    client_id: a.client_id ?? null,
    integration_id: a.integration_id ?? null,
    actor: a.actor ?? "system",
    actor_id: a.actor_id ?? null,
    action_type: a.action_type,
    provider: a.provider ?? null,
    status: a.status ?? "success",
    title: a.title,
    detail: a.detail ?? null,
    metadata: a.metadata ?? {},
    duration_ms: a.duration_ms ?? null,
  });
  if (error) console.error("audit failed", error.message);
  else await pushRealtime(a.client_id, "activity", { action_type: a.action_type, status: a.status ?? "success" });
}

/* ------------------------------------------------------------------ *
 * Realtime broadcast — pushes a "something changed" hint to a client  *
 * portal channel. The payload never carries data, only a hint, so the *
 * portal refetches through the authorised client-hub endpoint.        *
 * ------------------------------------------------------------------ */
export async function pushRealtime(
  clientId: string | null | undefined,
  event: string,
  payload: Record<string, unknown> = {},
) {
  if (!clientId) return;
  try {
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ topic: `client:${clientId}`, event, payload: { ...payload, at: new Date().toISOString() } }],
      }),
    });
    if (!res.ok) console.error("broadcast failed", res.status, (await res.text()).slice(0, 200));
  } catch (e) {
    console.error("broadcast error", (e as Error).message);
  }
}

/* ------------------------------------------------------------------ *
 * Client portal sessions — signed HMAC tokens issued by client-login  *
 * and verified by every endpoint that returns client data.            *
 * ------------------------------------------------------------------ */
const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function sessionKey() {
  const secret = Deno.env.get("CLIENT_SESSION_SECRET");
  if (!secret) throw new Error("CLIENT_SESSION_SECRET em falta");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function signClientSession(clientId: string) {
  const payload = b64url(enc.encode(JSON.stringify({ cid: clientId, exp: Date.now() + SESSION_TTL_MS })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

/** Returns the client id when the token is valid and unexpired, otherwise null. */
export async function verifyClientSession(token: unknown): Promise<string | null> {
  if (typeof token !== "string" || !token.includes(".")) return null;
  try {
    const [payload, sig] = token.split(".");
    const ok = await crypto.subtle.verify("HMAC", await sessionKey(), unb64url(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (!data?.cid || typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return data.cid as string;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Shared activity timeline — every relevant Admin/system write lands   *
 * here so the Client Portal reflects it without duplicating state.     *
 * ------------------------------------------------------------------ */
export interface EventInput {
  organization_id: string;
  client_id?: string | null;
  actor?: "system" | "admin" | "ai" | "client";
  actor_id?: string | null;
  entity: string;
  entity_id?: string | null;
  action: string;
  title: string;
  detail?: string | null;
  metadata?: Record<string, unknown>;
  visible_to_client?: boolean;
}

/** Append a shared timeline event and notify the client portal in realtime. */
export async function emitEvent(e: EventInput) {
  const { error } = await admin.from("activity_events").insert({
    organization_id: e.organization_id,
    client_id: e.client_id ?? null,
    actor: e.actor ?? "system",
    actor_id: e.actor_id ?? null,
    entity: e.entity,
    entity_id: e.entity_id ?? null,
    action: e.action,
    title: e.title,
    detail: e.detail ?? null,
    metadata: e.metadata ?? {},
    visible_to_client: e.visible_to_client ?? true,
  });
  if (error) console.error("emitEvent failed", error.message);
  await pushRealtime(e.client_id, "activity", { entity: e.entity, action: e.action });
}

export interface MetricFact {
  organization_id: string;
  client_id: string;
  source: string;
  metric: string;
  value: number;
  unit?: string | null;
  period?: string;
  date: string;
  campaign_id?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}

/** Normalized ingestion layer — every integration writes its metrics here. */
export async function writeMetricFacts(facts: MetricFact[]) {
  if (!facts.length) return;
  const rows = facts.map((f) => ({
    organization_id: f.organization_id,
    client_id: f.client_id,
    source: f.source,
    metric: f.metric,
    value: f.value,
    unit: f.unit ?? null,
    period: f.period ?? "day",
    date: f.date,
    campaign_id: f.campaign_id ?? "",
    entity_id: f.entity_id ?? "",
    metadata: f.metadata ?? {},
  }));
  const { error } = await admin
    .from("metric_facts")
    .upsert(rows, { onConflict: "client_id,source,metric,period,date,campaign_id,entity_id" });
  if (error) console.error("writeMetricFacts failed", error.message);
}
