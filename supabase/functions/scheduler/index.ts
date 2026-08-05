import { admin, corsHeaders, invokeFunction, json } from "../_shared/os.ts";
import { runIntegrationSync } from "../_shared/runSync.ts";

/**
 * Runs every few minutes (pg_cron). Picks every connected integration whose
 * next_sync_at is due and syncs it with retries + exponential backoff.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const nowIso = new Date().toISOString();
    const { data: due, error } = await admin
      .from("client_integrations")
      .select("*")
      .in("status", ["connected", "error"])
      .eq("auto_sync", true)
      .lte("next_sync_at", nowIso)
      .order("next_sync_at", { ascending: true })
      .limit(15);
    if (error) throw new Error(error.message);

    const results = [];
    for (const integration of due ?? []) {
      results.push(await runIntegrationSync(integration));
    }

    // organization-wide watchers (risk, leads, silent conversations)
    await invokeFunction("automation-engine", { trigger: "schedule" });

    return json({
      ran: results.length,
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (e) {
    console.error("scheduler error", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
