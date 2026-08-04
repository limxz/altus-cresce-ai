import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH = "https://graph.facebook.com/v21.0";

interface ClientRow {
  id: string;
  business_name: string;
  instagram_handle: string | null;
  meta_ad_account_id: string | null;
}

const today = () => new Date().toISOString().split("T")[0];

async function graphFetch(url: string) {
  const res = await fetch(url);
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`[${res.status}] ${body}`);
  }
  return JSON.parse(body);
}

/** Instagram metrics via Business Discovery (requires an owned IG Business account). */
async function fetchInstagram(handle: string, token: string, igAccountId: string) {
  const clean = handle.replace(/^@/, "").trim();
  const fields =
    `business_discovery.username(${clean}){followers_count,media_count,media.limit(12){like_count,comments_count,timestamp}}`;
  const data = await graphFetch(
    `${GRAPH}/${igAccountId}?fields=${encodeURIComponent(fields)}&access_token=${token}`,
  );

  const bd = data.business_discovery;
  if (!bd) return null;

  const media: any[] = bd.media?.data ?? [];
  const followers = bd.followers_count ?? 0;
  const interactions = media.reduce(
    (sum, m) => sum + (m.like_count ?? 0) + (m.comments_count ?? 0),
    0,
  );
  const engagement_rate = followers > 0 && media.length > 0
    ? Number(((interactions / media.length / followers) * 100).toFixed(2))
    : null;

  return {
    followers_count: followers,
    engagement_rate,
    reach: null as number | null,
    profile_visits: null as number | null,
    website_clicks: null as number | null,
  };
}

/** Meta Ads daily insights for the account. */
async function fetchAdInsights(adAccountId: string, token: string, date: string) {
  const acct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const fields = "spend,impressions,clicks,actions,cost_per_action_type";
  const timeRange = encodeURIComponent(JSON.stringify({ since: date, until: date }));
  const data = await graphFetch(
    `${GRAPH}/${acct}/insights?fields=${fields}&time_range=${timeRange}&access_token=${token}`,
  );

  const row = data.data?.[0];
  if (!row) return null;

  const actions: any[] = row.actions ?? [];
  const findAction = (types: string[]) =>
    actions
      .filter((a) => types.includes(a.action_type))
      .reduce((sum, a) => sum + Number(a.value ?? 0), 0);

  const spend = Number(row.spend ?? 0);
  const messages_started = findAction([
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.total_messaging_connection",
  ]);
  const conversions = findAction([
    "offsite_conversion.fb_pixel_lead",
    "lead",
    "onsite_conversion.lead_grouped",
  ]);

  return {
    spend,
    impressions: Number(row.impressions ?? 0),
    clicks: Number(row.clicks ?? 0),
    messages_started,
    cost_per_message: messages_started > 0 ? Number((spend / messages_started).toFixed(2)) : null,
    conversions,
    cost_per_conversion: conversions > 0 ? Number((spend / conversions).toFixed(2)) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = Deno.env.get("META_ACCESS_TOKEN");
    const igAccountId = Deno.env.get("META_IG_BUSINESS_ACCOUNT_ID");

    if (!token) {
      return new Response(
        JSON.stringify({ erro: "META_ACCESS_TOKEN não está configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let date = today();
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
          date = body.date;
        }
      } catch {
        // no body — use today
      }
    }

    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, business_name, instagram_handle, meta_ad_account_id");

    if (error) throw new Error(`Falha ao ler clientes: ${error.message}`);

    const resultados: any[] = [];

    for (const c of (clients ?? []) as ClientRow[]) {
      const entry: any = { client_id: c.id, business_name: c.business_name };

      // Instagram
      if (c.instagram_handle && igAccountId) {
        try {
          const ig = await fetchInstagram(c.instagram_handle, token, igAccountId);
          if (ig) {
            const { data: prev } = await supabase
              .from("instagram_metrics")
              .select("followers_count")
              .eq("client_id", c.id)
              .lt("date", date)
              .order("date", { ascending: false })
              .limit(1)
              .maybeSingle();

            const followers_gained = prev?.followers_count != null
              ? Math.max(0, ig.followers_count - prev.followers_count)
              : null;

            const { error: upErr } = await supabase
              .from("instagram_metrics")
              .upsert({ client_id: c.id, date, ...ig, followers_gained }, {
                onConflict: "client_id,date",
              });
            if (upErr) throw new Error(upErr.message);
            entry.instagram = { ok: true, followers: ig.followers_count, followers_gained };
          } else {
            entry.instagram = { ok: false, motivo: "sem dados de business_discovery" };
          }
        } catch (e) {
          console.error(`Instagram falhou para ${c.business_name}:`, String(e));
          entry.instagram = { ok: false, erro: String(e) };
        }
      } else {
        entry.instagram = { ok: false, motivo: !c.instagram_handle ? "sem instagram_handle" : "sem META_IG_BUSINESS_ACCOUNT_ID" };
      }

      // Meta Ads
      if (c.meta_ad_account_id) {
        try {
          const ads = await fetchAdInsights(c.meta_ad_account_id, token, date);
          if (ads) {
            const { error: upErr } = await supabase
              .from("ad_metrics")
              .upsert({ client_id: c.id, date, ...ads }, { onConflict: "client_id,date" });
            if (upErr) throw new Error(upErr.message);
            entry.ads = { ok: true, spend: ads.spend, conversions: ads.conversions };
          } else {
            entry.ads = { ok: false, motivo: "sem insights neste dia" };
          }
        } catch (e) {
          console.error(`Meta Ads falhou para ${c.business_name}:`, String(e));
          entry.ads = { ok: false, erro: String(e) };
        }
      } else {
        entry.ads = { ok: false, motivo: "sem meta_ad_account_id" };
      }

      resultados.push(entry);
    }

    console.log(`Sync concluído para ${resultados.length} clientes — ${date}`);

    return new Response(
      JSON.stringify({ sucesso: true, date, total: resultados.length, resultados }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Erro inesperado:", e);
    return new Response(
      JSON.stringify({ erro: "Erro interno", detalhe: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
