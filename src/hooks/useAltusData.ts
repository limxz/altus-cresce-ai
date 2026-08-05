import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Severity = "critico" | "atencao" | "oportunidade" | "info";

export interface ClientSignal {
  id: string;
  name: string;
  niche: string | null;
  mrr: number;
  health: number;
  drivers: { label: string; value: string; ok: boolean }[];
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  href?: string;
}

export interface OsData {
  loading: boolean;
  clients: ClientSignal[];
  notifications: Notification[];
  today: {
    leads: number;
    conversations: number;
    unanswered: number;
    mrr: number;
    activeClients: number;
    spend30d: number;
    conversions30d: number;
    meetings: number;
  };
  refresh: () => void;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function useAltusData(): OsData {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientSignal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [today, setToday] = useState<OsData["today"]>({
    leads: 0, conversations: 0, unanswered: 0, mrr: 0,
    activeClients: 0, spend30d: 0, conversions30d: 0, meetings: 0,
  });

  const load = useCallback(async () => {
    const sinceIso = new Date(Date.now() - 30 * 864e5).toISOString();
    const sinceDate = sinceIso.slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    const [clientsRes, convosRes, leadsRes, adsRes, igRes, pipeRes] = await Promise.all([
      supabase.from("clients").select("id, business_name, niche, status, mrr"),
      supabase
        .from("whatsapp_conversations")
        .select("client_id, contact_name, lead_status, last_message_at, is_read, started_at"),
      supabase.from("leads").select("id, nome, created_at").gte("created_at", sinceIso),
      supabase.from("ad_metrics").select("client_id, date, spend, clicks, impressions, conversions, messages_started").gte("date", sinceDate),
      supabase.from("instagram_metrics").select("client_id, date, followers_gained, engagement_rate, reach").gte("date", sinceDate),
      supabase.from("pipeline_leads").select("id, business_name, stage, plan_value, updated_at, next_action"),
    ]);

    const allClients = clientsRes.data ?? [];
    const convos = convosRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const ads = adsRes.data ?? [];
    const ig = igRes.data ?? [];
    const pipeline = pipeRes.data ?? [];

    const active = allClients.filter((c) => c.status === "active");
    const unanswered = convos.filter((c) => c.is_read === false).length;

    const signals: ClientSignal[] = active.map((c) => {
      const cConvos = convos.filter((x) => x.client_id === c.id);
      const cAds = ads.filter((x) => x.client_id === c.id);
      const cIg = ig.filter((x) => x.client_id === c.id);

      const last = cConvos
        .map((x) => new Date(x.last_message_at ?? x.started_at ?? 0).getTime())
        .sort((a, b) => b - a)[0] ?? 0;
      const daysSilent = last ? Math.floor((Date.now() - last) / 864e5) : 99;

      const clicks = cAds.reduce((s, x) => s + (x.clicks ?? 0), 0);
      const impressions = cAds.reduce((s, x) => s + (x.impressions ?? 0), 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const conv = cAds.reduce((s, x) => s + (x.conversions ?? 0), 0);
      const gained = cIg.reduce((s, x) => s + (x.followers_gained ?? 0), 0);
      const eng = cIg.length
        ? cIg.reduce((s, x) => s + Number(x.engagement_rate ?? 0), 0) / cIg.length
        : 0;
      const hot = cConvos.filter((x) => x.lead_status === "interessado" || x.lead_status === "marcou_consulta").length;

      let score = 40;
      score += Math.min(20, cConvos.length * 2);
      score += Math.min(12, hot * 4);
      score += Math.min(12, conv * 3);
      score += Math.min(8, gained / 25);
      score += ctr >= 1.5 ? 8 : ctr > 0 ? 4 : 0;
      score += eng >= 3 ? 6 : eng > 0 ? 3 : 0;
      score -= daysSilent > 7 ? 25 : daysSilent > 3 ? 12 : 0;
      score += Number(c.mrr ?? 0) > 0 ? 6 : 0;

      return {
        id: c.id,
        name: c.business_name,
        niche: c.niche,
        mrr: Number(c.mrr ?? 0),
        health: clamp(score),
        drivers: [
          { label: "Conversas 30d", value: String(cConvos.length), ok: cConvos.length > 0 },
          { label: "Leads quentes", value: String(hot), ok: hot > 0 },
          { label: "CTR", value: impressions ? `${ctr.toFixed(2)}%` : "—", ok: ctr >= 1.5 },
          { label: "Engagement", value: eng ? `${eng.toFixed(1)}%` : "—", ok: eng >= 3 },
          { label: "Sem resposta", value: last ? `${daysSilent}d` : "—", ok: daysSilent <= 3 },
        ],
      };
    });

    signals.sort((a, b) => a.health - b.health);

    const notes: Notification[] = [];
    signals.filter((s) => s.health < 50).forEach((s) =>
      notes.push({
        id: `risk-${s.id}`,
        title: `${s.name} em risco`,
        detail: `Health score ${s.health}/100. Rever conversas e campanhas.`,
        severity: "critico",
        href: `/admin/client/${s.id}`,
      }),
    );
    if (unanswered > 0)
      notes.push({
        id: "unanswered",
        title: `${unanswered} conversas por responder`,
        detail: "Leads à espera de resposta no WhatsApp.",
        severity: "atencao",
        href: "/admin/conversations",
      });
    const stale = pipeline.filter(
      (p) => p.stage !== "cliente" && p.stage !== "perdido" &&
        Date.now() - new Date(p.updated_at ?? 0).getTime() > 7 * 864e5,
    );
    if (stale.length)
      notes.push({
        id: "pipeline-stale",
        title: `${stale.length} negócios parados no pipeline`,
        detail: "Sem movimento há mais de 7 dias.",
        severity: "atencao",
        href: "/admin/pipeline",
      });
    if (leads.length)
      notes.push({
        id: "new-leads",
        title: `${leads.length} novos leads (30d)`,
        detail: "Qualificar e mover para o pipeline.",
        severity: "oportunidade",
        href: "/admin/leads",
      });
    if (ads.length === 0)
      notes.push({
        id: "no-ads",
        title: "Sem dados de Meta Ads",
        detail: "Liga a sincronização automática para ver CTR, CPA e ROAS.",
        severity: "info",
        href: "/admin/meta-ads",
      });

    setClients(signals);
    setNotifications(notes);
    setToday({
      leads: leads.length,
      conversations: convos.filter((c) => (c.started_at ?? "").slice(0, 10) === todayStr).length,
      unanswered,
      mrr: active.reduce((s, c) => s + Number(c.mrr ?? 0), 0),
      activeClients: active.length,
      spend30d: ads.reduce((s, x) => s + Number(x.spend ?? 0), 0),
      conversions30d: ads.reduce((s, x) => s + (x.conversions ?? 0), 0),
      meetings: pipeline.filter((p) => p.stage === "reuniao" || p.stage === "reuniao_marcada").length,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, clients, notifications, today, refresh: load };
}
