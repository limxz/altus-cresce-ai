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
