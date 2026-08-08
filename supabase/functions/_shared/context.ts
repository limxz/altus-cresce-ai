import { admin } from "./os.ts";

const dateAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const sum = (rows: any[], k: string) => rows.reduce((s, r) => s + num(r[k]), 0);
const pct = (curr: number, prev: number) => (prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null);

export interface SourceRef {
  key: string;
  label: string;
  window: string;
  status: "connected" | "missing";
}

export interface BusinessContext {
  client: any;
  profile: any;
  goals: any[];
  integrations: any[];
  connected: string[];
  missing: string[];
  metrics: Record<string, unknown>;
  history: Record<string, unknown>;
  leads: any[];
  activity: any[];
  insights: any[];
  sources: SourceRef[];
  dataDepthDays: number;
  confidence: "alta" | "media" | "baixa";
}

const PROVIDER_LABEL: Record<string, string> = {
  meta_ads: "Meta Ads",
  meta_business: "Meta Business",
  instagram: "Instagram",
  facebook: "Facebook",
  google_analytics: "Google Analytics",
  search_console: "Search Console",
  google_business: "Google Business Profile",
  google_ads: "Google Ads",
  shopify: "Shopify",
  crm: "CRM",
  whatsapp: "WhatsApp",
  calendar: "Calendar",
  email: "Email",
  website: "Website",
  tiktok: "TikTok",
};

export const providerLabel = (p: string) => PROVIDER_LABEL[p] ?? p.replace(/_/g, " ");

/**
 * Builds everything the AltusOS engine is allowed to reason about for ONE client.
 * Every query is filtered by client_id — no cross-client data can ever enter here.
 */
export async function buildBusinessContext(clientId: string): Promise<BusinessContext | null> {
  const { data: client } = await admin
    .from("clients")
    .select("id, business_name, contact_name, niche, industry, plan, status, brand_color, logo_url, start_date, organization_id, instagram_handle")
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return null;

  const [profile, goals, integrations, ig, ads, posts, convos, signups, activity, insights, facts] = await Promise.all([
    admin.from("business_profiles").select("*").eq("client_id", clientId).maybeSingle(),
    admin.from("business_goals").select("*").eq("client_id", clientId).eq("status", "active").order("created_at"),
    admin.from("client_integrations").select("id, provider, status, display_name, config, last_sync_at, last_error, auto_sync, next_sync_at").eq("client_id", clientId),
    admin.from("instagram_metrics").select("*").eq("client_id", clientId).gte("date", dateAgo(90)).order("date"),
    admin.from("ad_metrics").select("*").eq("client_id", clientId).gte("date", dateAgo(90)).order("date"),
    admin.from("post_metrics").select("*").eq("client_id", clientId).order("posted_at", { ascending: false }).limit(20),
    admin
      .from("whatsapp_conversations")
      .select("id, contact_name, lead_status, urgency, primary_need, last_message, last_message_at, started_at, status")
      .eq("client_id", clientId)
      .order("last_message_at", { ascending: false })
      .limit(40),
    admin.from("external_signups").select("id, source, name, occurred_at").eq("client_id", clientId).gte("occurred_at", daysAgo(90)).order("occurred_at", { ascending: false }),
    admin.from("activity_events").select("*").eq("client_id", clientId).gte("created_at", daysAgo(30)).order("created_at", { ascending: false }).limit(40),
    admin.from("ai_insights").select("*").eq("client_id", clientId).eq("status", "open").order("created_at", { ascending: false }).limit(10),
    admin.from("metric_facts").select("source, metric, value, date, campaign_id").eq("client_id", clientId).gte("date", dateAgo(90)).order("date", { ascending: false }).limit(500),
  ]);

  const igRows = ig.data ?? [];
  const adRows = ads.data ?? [];
  const convoRows = convos.data ?? [];
  const signupRows = signups.data ?? [];
  const integrationRows = integrations.data ?? [];

  const connected = integrationRows.filter((i: any) => i.status === "connected").map((i: any) => i.provider);
  const missing = Object.keys(PROVIDER_LABEL).filter((p) => !connected.includes(p));

  const windowStats = (days: number, offset = 0) => {
    const from = dateAgo(days + offset);
    const to = dateAgo(offset);
    const rows = adRows.filter((r: any) => r.date >= from && (offset === 0 ? true : r.date < to));
    const spend = sum(rows, "spend");
    const clicks = sum(rows, "clicks");
    const impressions = sum(rows, "impressions");
    const conversions = sum(rows, "conversions");
    const leads = convoRows.filter((c: any) => c.started_at && c.started_at >= daysAgo(days + offset) && (offset === 0 || c.started_at < daysAgo(offset))).length;
    const registos = signupRows.filter((s: any) => s.occurred_at >= daysAgo(days + offset) && (offset === 0 || s.occurred_at < daysAgo(offset))).length;
    return {
      spend: rows.length ? Number(spend.toFixed(2)) : null,
      clicks: rows.length ? clicks : null,
      impressions: rows.length ? impressions : null,
      conversions: rows.length ? conversions : null,
      ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : null,
      cpm: impressions ? Number(((spend / impressions) * 1000).toFixed(2)) : null,
      cpl: conversions ? Number((spend / conversions).toFixed(2)) : null,
      leads: convoRows.length ? leads : null,
      registos: signupRows.length ? registos : null,
    };
  };

  const last7 = windowStats(7);
  const prev7 = windowStats(7, 7);
  const last30 = windowStats(30);
  const prev30 = windowStats(30, 30);

  const igLast = igRows[igRows.length - 1] ?? null;
  const igWeek = igRows.find((r: any) => r.date >= dateAgo(7)) ?? null;
  const website = integrationRows.find((i: any) => i.provider === "website");

  const depth = (() => {
    const dates: string[] = [
      ...adRows.map((r: any) => r.date),
      ...igRows.map((r: any) => r.date),
      ...signupRows.map((s: any) => String(s.occurred_at).slice(0, 10)),
    ].filter(Boolean).sort();
    if (!dates.length) return 0;
    return Math.round((Date.now() - new Date(dates[0]).getTime()) / 864e5);
  })();

  const sources: SourceRef[] = [
    { key: "meta_ads", label: "Meta Ads", window: adRows.length ? "últimos 90 dias" : "sem dados", status: adRows.length ? "connected" : "missing" },
    { key: "instagram", label: "Instagram", window: igRows.length ? "últimos 90 dias" : "sem dados", status: igRows.length ? "connected" : "missing" },
    { key: "website", label: "Website", window: website?.last_sync_at ? "última medição" : "sem dados", status: website?.config?.performance != null ? "connected" : "missing" },
    { key: "leads", label: "Conversas / Leads", window: convoRows.length ? "últimas 40" : "sem dados", status: convoRows.length ? "connected" : "missing" },
    { key: "signups", label: "Inscrições do site", window: signupRows.length ? "últimos 90 dias" : "sem dados", status: signupRows.length ? "connected" : "missing" },
  ];

  const confidence: BusinessContext["confidence"] = depth >= 60 ? "alta" : depth >= 14 ? "media" : "baixa";

  const goalRows = (goals.data ?? []).map((g: any) => ({
    ...g,
    progress: g.target ? Math.min(100, Math.round((num(g.current_value) / num(g.target)) * 100)) : null,
  }));

  return {
    client,
    profile: profile.data ?? null,
    goals: goalRows,
    integrations: integrationRows.map((i: any) => ({
      id: i.id,
      provider: i.provider,
      label: providerLabel(i.provider),
      status: i.status,
      display_name: i.display_name,
      last_sync_at: i.last_sync_at,
      last_error: i.last_error,
    })),
    connected,
    missing,
    metrics: {
      periodo_7d: last7,
      periodo_7d_anterior: prev7,
      variacao_7d: {
        leads: pct(last7.leads ?? 0, prev7.leads ?? 0),
        conversoes: pct(last7.conversions ?? 0, prev7.conversions ?? 0),
        investimento: pct(last7.spend ?? 0, prev7.spend ?? 0),
        cpl: last7.cpl && prev7.cpl ? pct(last7.cpl, prev7.cpl) : null,
        ctr: last7.ctr && prev7.ctr ? pct(last7.ctr, prev7.ctr) : null,
        cpm: last7.cpm && prev7.cpm ? pct(last7.cpm, prev7.cpm) : null,
        registos: pct(last7.registos ?? 0, prev7.registos ?? 0),
      },
      periodo_30d: last30,
      periodo_30d_anterior: prev30,
      instagram: igRows.length
        ? {
          seguidores: igLast?.followers_count ?? null,
          variacao_semana: igLast && igWeek ? num(igLast.followers_count) - num(igWeek.followers_count) : null,
          engagement: igLast?.engagement_rate ?? null,
          alcance: igLast?.reach ?? null,
        }
        : null,
      website: website?.config?.performance != null
        ? {
          url: website.config?.url ?? null,
          performance: website.config.performance,
          seo: website.config?.seo ?? null,
          acessibilidade: website.config?.accessibility ?? null,
          medido_em: website.config?.measured_at ?? website.last_sync_at,
        }
        : null,
      melhores_posts: (posts.data ?? []).slice(0, 6).map((p: any) => ({
        tipo: p.post_type, alcance: p.reach, likes: p.likes, comentarios: p.comments, estrutura: p.script_structure,
      })),
    },
    history: {
      anuncios_por_dia: adRows.slice(-30),
      instagram_por_dia: igRows.slice(-30),
      factos_normalizados: (facts.data ?? []).slice(0, 120),
    },
    leads: convoRows.slice(0, 20),
    activity: (activity.data ?? []).map((a: any) => ({ at: a.created_at, title: a.title, detail: a.detail, entity: a.entity, action: a.action })),
    insights: insights.data ?? [],
    sources,
    dataDepthDays: depth,
    confidence,
  };
}
