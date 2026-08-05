import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HubKpi { value: number | null; delta: number | null }

export interface HubNotification {
  id: string;
  category: string;
  severity: "critico" | "atencao" | "oportunidade" | "info" | string;
  title: string;
  detail: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface HubSnapshot {
  client: any;
  memory: any;
  kpis: Record<string, HubKpi>;
  ads: any;
  instagram: any;
  website: any;
  integrations: any[];
  leads: any[];
  signups: {
    total: number;
    last7: number;
    delta: number | null;
    recent: any[];
    series: { date: string; count: number }[];
  } | null;
  recommendations: any[];
  reports: any[];
  documents: any[];
  meetings: any[];
  notifications: HubNotification[];
  timeline: any[];
}

export interface Briefing {
  headline: string;
  bullets: { text: string; tone: "positivo" | "neutro" | "atencao" }[];
  risk: string | null;
}

/** Fallback poll — realtime broadcast carries the fast path. */
const POLL_MS = 300_000;

const invokeHub = async (clientId: string, session: string | null, body: Record<string, unknown>) =>
  supabase.functions.invoke("client-hub", { body: { client_id: clientId, session, ...body } });

export const useClientHub = (clientId: string | undefined, session: string | null = null) => {
  const [data, setData] = useState<HubSnapshot | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [liveAt, setLiveAt] = useState<Date | null>(null);
  const briefingFor = useRef<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!clientId) return;
      silent ? setRefreshing(true) : setLoading(true);
      const { data: res, error: err } = await invokeHub(clientId, session, {});
      if (err || (res as any)?.error) {
        setError((res as any)?.error ?? err?.message ?? "Não foi possível carregar os dados.");
      } else {
        setError(null);
        setData(res as HubSnapshot);
        setUpdatedAt(new Date());
      }
      setLoading(false);
      setRefreshing(false);
    },
    [clientId, session],
  );

  const loadBriefing = useCallback(async () => {
    if (!clientId || briefingFor.current === clientId) return;
    briefingFor.current = clientId;
    const { data: res } = await invokeHub(clientId, session, { action: "briefing" });
    if ((res as any)?.briefing) setBriefing((res as any).briefing);
  }, [clientId, session]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (data && !briefing) loadBriefing();
  }, [data, briefing, loadBriefing]);

  /* Realtime: the backend broadcasts a hint on `client:<id>` whenever it writes
     something for this client. The hint carries no data — we refetch through the
     authorised endpoint so the client only ever sees what it is allowed to see. */
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`client:${clientId}`, { config: { private: false } })
      .on("broadcast", { event: "*" }, () => {
        setLiveAt(new Date());
        load(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, load]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!clientId) return;
      setData((d) =>
        d ? { ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)) } : d,
      );
      await invokeHub(clientId, session, { action: "mark_read", notification_id: id });
    },
    [clientId, session],
  );

  const markAllRead = useCallback(async () => {
    if (!clientId) return;
    const now = new Date().toISOString();
    setData((d) => (d ? { ...d, notifications: d.notifications.map((n) => ({ ...n, read_at: n.read_at ?? now })) } : d));
    await invokeHub(clientId, session, { action: "mark_all_read" });
  }, [clientId, session]);

  return {
    data, briefing, loading, refreshing, error, updatedAt, liveAt,
    reload: () => load(true), markNotificationRead, markAllRead,
  };
};

export const askAssistant = async (
  clientId: string,
  session: string | null,
  messages: { role: string; content: string }[],
) => {
  const { data, error } = await invokeHub(clientId, session, { action: "chat", messages });
  if (error) throw new Error(error.message);
  return (data as any)?.reply ?? "";
};

export const openDocument = async (clientId: string, session: string | null, documentId: string) => {
  const { data, error } = await invokeHub(clientId, session, { action: "document_url", document_id: documentId });
  if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
  return (data as any).url as string;
};
