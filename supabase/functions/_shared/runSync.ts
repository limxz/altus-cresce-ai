import { admin, invokeFunction, notify } from "./os.ts";
import { SYNCERS } from "./providers.ts";

/** Exponential backoff in minutes per consecutive failure. */
const BACKOFF = [5, 15, 45, 120, 360];

export interface SyncOutcome {
  ok: boolean;
  provider: string;
  records?: number;
  summary?: string;
  error?: string;
  duration_ms: number;
}

/**
 * Runs one integration sync with retries, backoff scheduling, sync-run logging
 * and real notifications. Triggers the AI agent + automation engine on success.
 */
export async function runIntegrationSync(integration: any, opts: { attempts?: number } = {}): Promise<SyncOutcome> {
  const attempts = opts.attempts ?? 2;
  const started = Date.now();
  const provider = integration.provider as string;
  const clientId = integration.client_id as string;
  const orgId = integration.organization_id as string;

  const syncer = SYNCERS[provider];
  if (!syncer) {
    return { ok: false, provider, error: `Sincronização indisponível para ${provider}.`, duration_ms: 0 };
  }

  const { data: cred } = await admin
    .from("integration_credentials").select("secrets").eq("integration_id", integration.id).maybeSingle();

  let lastError = "";
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await syncer(clientId, cred?.secrets ?? {}, integration.config ?? {});
      const duration = Date.now() - started;
      const interval = Number(integration.sync_interval_minutes ?? 60);

      await admin.from("client_integrations").update({
        status: "connected",
        last_sync_at: new Date().toISOString(),
        last_error: null,
        failure_count: 0,
        backoff_until: null,
        next_sync_at: new Date(Date.now() + interval * 60_000).toISOString(),
        config: result.patch ? { ...(integration.config ?? {}), ...result.patch } : integration.config,
      }).eq("id", integration.id);

      await admin.from("integration_sync_runs").insert({
        integration_id: integration.id, client_id: clientId, provider,
        status: "success", records_written: result.records ?? 0,
        message: result.summary ?? null, duration_ms: duration,
      });

      // clear previous failure alert
      await admin.from("notifications").delete()
        .eq("organization_id", orgId).eq("dedupe_key", `sync-fail-${integration.id}`);

      // AI agent + automations run right after fresh data lands
      await invokeFunction("client-agent", { client_id: clientId, trigger: `sync:${provider}` });
      await invokeFunction("automation-engine", { client_id: clientId, trigger: `sync:${provider}` });

      return { ok: true, provider, records: result.records, summary: result.summary, duration_ms: duration };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }

  const failures = Number(integration.failure_count ?? 0) + 1;
  const waitMin = BACKOFF[Math.min(failures - 1, BACKOFF.length - 1)];
  const nextAt = new Date(Date.now() + waitMin * 60_000).toISOString();

  await admin.from("client_integrations").update({
    status: "error",
    last_error: lastError,
    failure_count: failures,
    backoff_until: nextAt,
    next_sync_at: nextAt,
  }).eq("id", integration.id);

  await admin.from("integration_sync_runs").insert({
    integration_id: integration.id, client_id: clientId, provider,
    status: "error", message: lastError, duration_ms: Date.now() - started,
  });

  await notify({
    organization_id: orgId,
    client_id: clientId,
    category: "integration",
    severity: failures >= 3 ? "critico" : "atencao",
    title: `Sincronização falhou · ${provider}`,
    detail: `${lastError.slice(0, 220)} — nova tentativa em ${waitMin} min (tentativa ${failures}).`,
    href: "/admin/integracoes",
    dedupe_key: `sync-fail-${integration.id}`,
  });

  return { ok: false, provider, error: lastError, duration_ms: Date.now() - started };
}
