import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HubKpi { value: number | null; delta: number | null }

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
  notifications: any[];
  timeline: any[];
}

export interface Briefing {
  headline: string;
  bullets: { text: string; tone: "positivo" | "neutro" | "atencao" }[];
  risk: string | null;
}

const POLL_MS = 60_000;

export const useClientHub = (clientId: string | undefined) => {
  const [data, setData] = useState<HubSnapshot | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const briefingFor = useRef<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!clientId) return;
      silent ? setRefreshing(true) : setLoading(true);
      const { data: res, error: err } = await supabase.functions.invoke("client-hub", {
        body: { client_id: clientId },
      });
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
    [clientId],
  );

  const loadBriefing = useCallback(async () => {
    if (!clientId || briefingFor.current === clientId) return;
    briefingFor.current = clientId;
    const { data: res } = await supabase.functions.invoke("client-hub", {
      body: { client_id: clientId, action: "briefing" },
    });
    if ((res as any)?.briefing) setBriefing((res as any).briefing);
  }, [clientId]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (data && !briefing) loadBriefing();
  }, [data, briefing, loadBriefing]);

  // Live refresh when the backend writes new data for this client
  useEffect(() => {
    if (!clientId) return;
    const filter = `client_id=eq.${clientId}`;
    const channel = supabase.channel(`hub-${clientId}`);
    for (const table of [
      "ad_metrics", "instagram_metrics", "notifications", "audit_log",
      "client_documents", "client_meetings", "whatsapp_conversations", "client_reports",
    ]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table, filter }, () => load(true));
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, load]);

  return { data, briefing, loading, refreshing, error, updatedAt, reload: () => load(true) };
};

export const askAssistant = async (clientId: string, messages: { role: string; content: string }[]) => {
  const { data, error } = await supabase.functions.invoke("client-hub", {
    body: { client_id: clientId, action: "chat", messages },
  });
  if (error) throw new Error(error.message);
  return (data as any)?.reply ?? "";
};

export const openDocument = async (clientId: string, documentId: string) => {
  const { data, error } = await supabase.functions.invoke("client-hub", {
    body: { client_id: clientId, action: "document_url", document_id: documentId },
  });
  if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
  return (data as any).url as string;
};
