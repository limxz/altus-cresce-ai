import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v21.0";
const today = () => new Date().toISOString().slice(0, 10);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

async function graph(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta API [${res.status}] ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

/* ---------------- providers ---------------- */

async function syncInstagram(clientId: string, secrets: any, config: any) {
  const token = secrets.access_token;
  const igId = config.ig_business_account_id;
  if (!token || !igId) throw new Error("Falta access_token ou ig_business_account_id.");

  const fields =
    "followers_count,media_count,media.limit(25){like_count,comments_count,timestamp,media_product_type}";
  const data = await graph(`${GRAPH}/${igId}?fields=${encodeURIComponent(fields)}&access_token=${token}`);

  const media: any[] = data.media?.data ?? [];
  const followers = data.followers_count ?? 0;
  const interactions = media.reduce((s, m) => s + (m.like_count ?? 0) + (m.comments_count ?? 0), 0);
  const engagement = followers > 0 && media.length
    ? Number(((interactions / media.length / followers) * 100).toFixed(2))
    : null;

  let reach: number | null = null;
  let profileVisits: number | null = null;
  try {
    const ins = await graph(
      `${GRAPH}/${igId}/insights?metric=reach,profile_views&period=day&access_token=${token}`,
    );
    for (const m of ins.data ?? []) {
      const v = m.values?.[0]?.value ?? null;
      if (m.name === "reach") reach = v;
      if (m.name === "profile_views") profileVisits = v;
    }
  } catch (_) { /* insights need owned account permissions */ }

  const { error } = await admin.from("instagram_metrics").upsert(
    {
      client_id: clientId,
      date: today(),
      followers_count: followers,
      engagement_rate: engagement,
      reach,
      profile_visits: profileVisits,
    },
    { onConflict: "client_id,date" },
  );
  if (error) throw new Error(error.message);

  // real per-post metrics
  let posts = 0;
  for (const m of media.slice(0, 12)) {
    const { error: pe } = await admin.from("post_metrics").upsert({
      client_id: clientId,
      post_type: m.media_product_type ?? null,
      posted_at: m.timestamp ?? null,
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
    });
    if (!pe) posts++;
  }
  return { records: 1 + posts, summary: `${followers} seguidores · ${media.length} publicações analisadas` };
}

async function syncMetaAds(clientId: string, secrets: any, config: any) {
  const token = secrets.access_token;
  const acc = String(config.ad_account_id ?? "").replace(/^act_/, "");
  if (!token || !acc) throw new Error("Falta access_token ou ad_account_id.");

  const fields = "spend,impressions,clicks,actions,cost_per_action_type,date_start";
  const data = await graph(
    `${GRAPH}/act_${acc}/insights?fields=${fields}&date_preset=last_30d&time_increment=1&access_token=${token}`,
  );

  let written = 0;
  for (const row of data.data ?? []) {
    const actions: any[] = row.actions ?? [];
    const find = (t: string) => Number(actions.find((a) => a.action_type === t)?.value ?? 0);
    const messages = find("onsite_conversion.messaging_conversation_started_7d");
    const conversions = find("lead") + find("offsite_conversion.fb_pixel_lead") + messages;
    const spend = Number(row.spend ?? 0);
    const { error } = await admin.from("ad_metrics").upsert(
      {
        client_id: clientId,
        date: row.date_start,
        spend,
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        messages_started: messages,
        cost_per_message: messages ? Number((spend / messages).toFixed(2)) : null,
        conversions,
        cost_per_conversion: conversions ? Number((spend / conversions).toFixed(2)) : null,
      },
      { onConflict: "client_id,date" },
    );
    if (!error) written++;
  }
  return { records: written, summary: `${written} dias de campanha sincronizados` };
}

async function syncWebsite(_clientId: string, _secrets: any, config: any) {
  const url = config.url;
  if (!url) throw new Error("Falta o endereço do website.");
  const api =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile` +
    `&category=performance&category=seo&category=accessibility&category=best-practices`;
  const res = await fetch(api);
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? "PageSpeed Insights indisponível.");

  const cat = body.lighthouseResult?.categories ?? {};
  const audits = body.lighthouseResult?.audits ?? {};
  const score = (k: string) => (cat[k]?.score != null ? Math.round(cat[k].score * 100) : null);

  return {
    records: 1,
    summary: `Performance ${score("performance") ?? "—"} · SEO ${score("seo") ?? "—"}`,
    patch: {
      performance: score("performance"),
      seo: score("seo"),
      accessibility: score("accessibility"),
      best_practices: score("best-practices"),
      lcp: audits["largest-contentful-paint"]?.displayValue ?? null,
      cls: audits["cumulative-layout-shift"]?.displayValue ?? null,
      tbt: audits["total-blocking-time"]?.displayValue ?? null,
      measured_at: new Date().toISOString(),
    },
  };
}

const SYNCERS: Record<string, (c: string, s: any, cfg: any) => Promise<any>> = {
  instagram: syncInstagram,
  facebook_page: syncInstagram,
  meta_ads: syncMetaAds,
  website: syncWebsite,
};

/* ---------------- handler ---------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return json({ error: "Não autenticado." }, 401);
    const { data: userData } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) return json({ error: "Sessão inválida." }, 401);

    const { action, client_id, provider, config = {}, secrets = {}, integration_id } = await req.json();

    // resolve integration + authorize by org membership
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

    /* disconnect */
    if (action === "disconnect") {
      if (!integration) return json({ error: "Integração não encontrada." }, 404);
      await admin.from("integration_credentials").delete().eq("integration_id", integration.id);
      await admin.from("client_integrations")
        .update({ status: "disconnected", last_error: null }).eq("id", integration.id);
      return json({ ok: true });
    }

    /* sync */
    if (action === "sync") {
      if (!integration) return json({ error: "Integração não encontrada." }, 404);
      const syncer = SYNCERS[integration.provider];
      if (!syncer) return json({ error: `A sincronização para ${integration.provider} ainda não está disponível.` }, 400);

      const { data: cred } = await admin.from("integration_credentials")
        .select("secrets").eq("integration_id", integration.id).maybeSingle();

      const started = Date.now();
      try {
        const result = await syncer(clientId, cred?.secrets ?? {}, integration.config ?? {});
        const duration = Date.now() - started;
        await admin.from("client_integrations").update({
          status: "connected",
          last_sync_at: new Date().toISOString(),
          last_error: null,
          config: result.patch ? { ...integration.config, ...result.patch } : integration.config,
        }).eq("id", integration.id);
        await admin.from("integration_sync_runs").insert({
          integration_id: integration.id, client_id: clientId, provider: integration.provider,
          status: "success", records_written: result.records ?? 0, message: result.summary ?? null,
          duration_ms: duration,
        });
        return json({ ok: true, ...result, duration_ms: duration });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await admin.from("client_integrations")
          .update({ status: "error", last_error: msg }).eq("id", integration.id);
        await admin.from("integration_sync_runs").insert({
          integration_id: integration.id, client_id: clientId, provider: integration.provider,
          status: "error", message: msg, duration_ms: Date.now() - started,
        });
        return json({ error: msg }, 502);
      }
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    console.error("integrations error", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
