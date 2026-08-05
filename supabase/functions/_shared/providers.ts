import { admin, today } from "./os.ts";

const GRAPH = "https://graph.facebook.com/v21.0";

export interface SyncResult {
  records: number;
  summary: string;
  patch?: Record<string, unknown>;
}

async function graph(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta API [${res.status}] ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function syncInstagram(clientId: string, secrets: any, config: any): Promise<SyncResult> {
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

export async function syncMetaAds(clientId: string, secrets: any, config: any): Promise<SyncResult> {
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

export async function syncWebsite(_clientId: string, _secrets: any, config: any): Promise<SyncResult> {
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

export const SYNCERS: Record<string, (c: string, s: any, cfg: any) => Promise<SyncResult>> = {
  instagram: syncInstagram,
  facebook_page: syncInstagram,
  meta_ads: syncMetaAds,
  website: syncWebsite,
};
