import { admin, corsHeaders, json } from "../_shared/os.ts";
import { runIntegrationSync } from "../_shared/runSync.ts";
import { SYNCERS } from "../_shared/providers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ error: "Não autenticado." }, 401);
    const { data: userData } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) return json({ error: "Sessão inválida." }, 401);

    const {
      action, client_id, provider, config = {}, secrets = {}, integration_id,
      sync_interval_minutes, auto_sync,
    } = await req.json();

    let integration: any = null;
    if (integration_id) {
      const { data } = await admin.from("client_integrations").select("*").eq("id", integration_id).maybeSingle();
      integration = data;
    }
    const clientId = integration?.client_id ?? client_id;
    if (!clientId) return json({ error: "client_id em falta." }, 400);

    const { data: client } = await admin
      .from("clients").select("id, organization_id, business_name").eq("id", clientId).maybeSingle();
    if (!client) return json({ error: "Cliente não encontrado." }, 404);

    const [{ data: member }, { data: role }] = await Promise.all([
      admin.from("organization_members").select("id")
        .eq("organization_id", client.organization_id).eq("user_id", user.id).maybeSingle(),
      admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    ]);
    if (!member && !role) return json({ error: "Sem permissão para este cliente." }, 403);

    /* connect */
    if (action === "connect") {
      const { data: up, error } = await admin.from("client_integrations").upsert(
        {
          organization_id: client.organization_id,
          client_id: clientId,
          provider,
          status: "connected",
          external_account_id: config.ad_account_id ?? config.ig_business_account_id ?? config.url ?? null,
          display_name: config.display_name ?? null,
          config,
          last_error: null,
          failure_count: 0,
          backoff_until: null,
          next_sync_at: new Date().toISOString(),
          ...(sync_interval_minutes ? { sync_interval_minutes } : {}),
        },
        { onConflict: "client_id,provider" },
      ).select().single();
      if (error) throw new Error(error.message);

      if (Object.keys(secrets).length) {
        await admin.from("integration_credentials")
          .upsert({ integration_id: up.id, secrets, updated_at: new Date().toISOString() });
      }
      return json({ integration: up });
    }

    /* schedule: interval / auto sync toggle */
    if (action === "schedule") {
      if (!integration) return json({ error: "Integração não encontrada." }, 404);
      const patch: Record<string, unknown> = {};
      if (sync_interval_minutes != null) {
        patch.sync_interval_minutes = Math.max(15, Number(sync_interval_minutes));
        patch.next_sync_at = new Date().toISOString();
      }
      if (auto_sync != null) patch.auto_sync = !!auto_sync;
      const { data, error } = await admin.from("client_integrations")
        .update(patch).eq("id", integration.id).select().single();
      if (error) throw new Error(error.message);
      return json({ integration: data });
    }

    /* disconnect */
    if (action === "disconnect") {
      if (!integration) return json({ error: "Integração não encontrada." }, 404);
      await admin.from("integration_credentials").delete().eq("integration_id", integration.id);
      await admin.from("client_integrations")
        .update({ status: "disconnected", last_error: null, auto_sync: false }).eq("id", integration.id);
      return json({ ok: true });
    }

    /* sync (manual, same engine as the scheduler) */
    if (action === "sync") {
      if (!integration) return json({ error: "Integração não encontrada." }, 404);
      if (!SYNCERS[integration.provider]) {
        return json({ error: `A sincronização para ${integration.provider} ainda não está disponível.` }, 400);
      }
      const outcome = await runIntegrationSync(integration);
      return outcome.ok ? json({ ok: true, ...outcome }) : json({ error: outcome.error }, 502);
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    console.error("integrations error", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
