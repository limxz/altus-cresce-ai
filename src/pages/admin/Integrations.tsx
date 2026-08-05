import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Panel, Skeleton, Label, EmptyHint } from "@/components/admin/os/Primitives";
import { toast } from "@/hooks/use-toast";
import {
  Instagram, Facebook, Megaphone, Globe, LineChart, Search, MapPin,
  CreditCard, CalendarDays, Mail, MessageSquare, Users2, RefreshCw, Plug, X, Loader2, Check,
} from "lucide-react";

type FieldKind = "text" | "secret";
interface Field { key: string; label: string; kind: FieldKind; placeholder?: string; hint?: string }

interface ProviderDef {
  id: string;
  name: string;
  icon: typeof Instagram;
  description: string;
  live: boolean;
  fields: Field[];
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "instagram", name: "Instagram", icon: Instagram, live: true,
    description: "Seguidores, alcance, engagement e desempenho por publicação.",
    fields: [
      { key: "ig_business_account_id", label: "ID da conta Instagram Business", kind: "text", placeholder: "17841400000000000" },
      { key: "access_token", label: "Access token da Meta", kind: "secret", hint: "Token de longa duração com instagram_basic e instagram_manage_insights." },
    ],
  },
  {
    id: "meta_ads", name: "Meta Ads", icon: Megaphone, live: true,
    description: "Investimento, CTR, CPA, conversões e mensagens iniciadas, dia a dia.",
    fields: [
      { key: "ad_account_id", label: "ID da conta de anúncios", kind: "text", placeholder: "act_1234567890" },
      { key: "access_token", label: "Access token da Meta", kind: "secret", hint: "Necessita da permissão ads_read." },
    ],
  },
  {
    id: "facebook_page", name: "Facebook Page", icon: Facebook, live: true,
    description: "Métricas da página ligada ao Instagram Business.",
    fields: [
      { key: "ig_business_account_id", label: "ID da conta Instagram Business ligada", kind: "text" },
      { key: "access_token", label: "Page access token", kind: "secret" },
    ],
  },
  {
    id: "website", name: "Website", icon: Globe, live: true,
    description: "Core Web Vitals, performance, SEO e acessibilidade via PageSpeed Insights.",
    fields: [{ key: "url", label: "Endereço do website", kind: "text", placeholder: "https://exemplo.pt" }],
  },
  {
    id: "google_analytics", name: "Google Analytics 4", icon: LineChart, live: false,
    description: "Sessões, origem de tráfego e conversões.",
    fields: [{ key: "property_id", label: "Property ID", kind: "text", placeholder: "properties/123456789" }],
  },
  {
    id: "search_console", name: "Search Console", icon: Search, live: false,
    description: "Impressões, cliques, posição média e queries.",
    fields: [{ key: "site_url", label: "Propriedade", kind: "text", placeholder: "sc-domain:exemplo.pt" }],
  },
  {
    id: "google_business", name: "Google Business", icon: MapPin, live: false,
    description: "Reviews, pesquisas locais e pedidos de direções.",
    fields: [{ key: "location_id", label: "Location ID", kind: "text" }],
  },
  {
    id: "stripe", name: "Stripe", icon: CreditCard, live: false,
    description: "Receita, MRR, churn e pagamentos recebidos.",
    fields: [{ key: "secret_key", label: "Chave secreta", kind: "secret", placeholder: "sk_live_..." }],
  },
  {
    id: "calendar", name: "Calendário", icon: CalendarDays, live: false,
    description: "Reuniões marcadas, no-shows e ocupação da agenda.",
    fields: [{ key: "calendar_id", label: "ID do calendário", kind: "text" }],
  },
  {
    id: "email", name: "Email (Resend)", icon: Mail, live: false,
    description: "Envios, aberturas e respostas das campanhas de email.",
    fields: [{ key: "api_key", label: "API key", kind: "secret", placeholder: "re_..." }],
  },
  {
    id: "whatsapp", name: "WhatsApp Business", icon: MessageSquare, live: false,
    description: "Conversas, tempo de resposta e leads gerados.",
    fields: [
      { key: "phone_number_id", label: "Phone number ID", kind: "text" },
      { key: "access_token", label: "Access token", kind: "secret" },
    ],
  },
  {
    id: "crm", name: "CRM externo", icon: Users2, live: false,
    description: "Sincronização bidirecional de leads e negócios.",
    fields: [{ key: "webhook_url", label: "Webhook", kind: "text", placeholder: "https://" }],
  },
];

interface IntegrationRow {
  id: string; client_id: string; provider: string; status: string;
  external_account_id: string | null; last_sync_at: string | null; last_error: string | null;
  config: Record<string, unknown>;
}
interface ClientRow { id: string; business_name: string }
interface RunRow { id: string; provider: string; status: string; message: string | null; created_at: string; records_written: number }

const ago = (iso: string | null) => {
  if (!iso) return "nunca";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  if (m < 1440) return `há ${Math.floor(m / 60)}h`;
  return `há ${Math.floor(m / 1440)}d`;
};

const Integrations = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProviderDef | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("clients").select("id, business_name").order("business_name").then(({ data }) => {
      setClients(data ?? []);
      setClientId((c) => c || data?.[0]?.id || "");
      if (!data?.length) setLoading(false);
    });
  }, []);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const [i, r] = await Promise.all([
      supabase.from("client_integrations").select("*").eq("client_id", clientId),
      supabase.from("integration_sync_runs").select("id, provider, status, message, created_at, records_written")
        .eq("client_id", clientId).order("created_at", { ascending: false }).limit(12),
    ]);
    setRows((i.data ?? []) as IntegrationRow[]);
    setRuns((r.data ?? []) as RunRow[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!clientId) return;
    const ch = supabase
      .channel(`integrations-${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_integrations", filter: `client_id=eq.${clientId}` }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "integration_sync_runs", filter: `client_id=eq.${clientId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, load]);

  const byProvider = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.provider, r])) as Record<string, IntegrationRow | undefined>,
    [rows],
  );

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("integrations", { body });
    if (error) {
      let detail = error.message;
      try { detail = (await (error as unknown as { context: Response }).context.text()) || detail; } catch { /* noop */ }
      throw new Error(detail);
    }
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data;
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(editing.id);
    const config: Record<string, string> = {};
    const secrets: Record<string, string> = {};
    editing.fields.forEach((f) => {
      const v = (form[f.key] ?? "").trim();
      if (!v) return;
      (f.kind === "secret" ? secrets : config)[f.key] = v;
    });
    try {
      await call({ action: "connect", client_id: clientId, provider: editing.id, config, secrets });
      toast({ title: `${editing.name} ligado`, description: "A sincronizar pela primeira vez…" });
      setEditing(null);
      await load();
      const fresh = await supabase.from("client_integrations").select("id")
        .eq("client_id", clientId).eq("provider", editing.id).maybeSingle();
      if (fresh.data && editing.live) await sync(fresh.data.id, editing.id);
    } catch (e) {
      toast({ variant: "destructive", title: "Não foi possível ligar", description: (e as Error).message });
    } finally {
      setBusy(null);
      load();
    }
  };

  const sync = async (id: string, provider: string) => {
    setBusy(provider);
    try {
      const res = await call({ action: "sync", integration_id: id }) as { summary?: string };
      toast({ title: "Sincronizado", description: res?.summary ?? "Dados atualizados." });
    } catch (e) {
      toast({ variant: "destructive", title: "Falha na sincronização", description: (e as Error).message });
    } finally {
      setBusy(null);
      load();
    }
  };

  const disconnect = async (id: string, provider: string) => {
    setBusy(provider);
    try {
      await call({ action: "disconnect", integration_id: id });
      toast({ title: "Integração desligada" });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro", description: (e as Error).message });
    } finally {
      setBusy(null);
      load();
    }
  };

  const connected = rows.filter((r) => r.status === "connected").length;
  const errored = rows.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[24px] font-medium tracking-[-0.02em]">Integrações</h1>
        <p className="os-dim text-[14px] mt-1">
          Cada cliente liga as suas próprias contas. Os dados entram sozinhos — nada é inserido à mão.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="os-btn !h-9 min-w-[220px]"
          style={{ background: "var(--os-panel)" }}
        >
          {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
        <span className="text-xs os-faint">
          {connected} ligadas · {errored} com erro · {PROVIDERS.length - connected} por ligar
        </span>
      </div>

      {!clients.length && !loading ? (
        <Panel><EmptyHint title="Ainda não existem clientes" hint="Cria um cliente para ligar as suas plataformas." /></Panel>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[128px] !rounded-2xl" />)
            : PROVIDERS.map((p, i) => {
                const row = byProvider[p.id];
                const status = row?.status ?? "disconnected";
                const dot = status === "connected" ? "var(--os-green)" : status === "error" ? "var(--os-red)" : "rgba(255,255,255,.22)";
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}>
                    <Panel hover className="p-4 h-full flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "rgba(255,255,255,.05)" }}>
                          <p.icon size={15} strokeWidth={1.7} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px]">{p.name}</p>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                            {!p.live && <span className="text-[10px] os-faint">brevemente</span>}
                          </div>
                          <p className="text-[12px] os-dim mt-0.5 leading-relaxed">{p.description}</p>
                        </div>
                      </div>

                      <div className="text-[11px] os-faint">
                        {status === "connected" && <>Última sincronização {ago(row?.last_sync_at ?? null)}</>}
                        {status === "error" && <span style={{ color: "var(--os-red)" }}>{row?.last_error?.slice(0, 90)}</span>}
                        {status === "disconnected" && "Desconectado"}
                      </div>

                      <div className="mt-auto flex items-center gap-2">
                        {row && status !== "disconnected" ? (
                          <>
                            {p.live && (
                              <button className="os-btn" disabled={busy === p.id} onClick={() => sync(row.id, p.id)}>
                                {busy === p.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                Sincronizar
                              </button>
                            )}
                            <button className="os-btn" onClick={() => { setEditing(p); setForm({}); }}>Editar</button>
                            <button className="os-btn ml-auto" onClick={() => disconnect(row.id, p.id)}>Desligar</button>
                          </>
                        ) : (
                          <button className="os-btn os-btn-accent" onClick={() => { setEditing(p); setForm({}); }}>
                            <Plug size={12} /> Ligar
                          </button>
                        )}
                      </div>
                    </Panel>
                  </motion.div>
                );
              })}
        </div>
      )}

      <section className="space-y-3">
        <Label>Histórico de sincronizações</Label>
        <Panel className="divide-y" style={{ borderColor: "var(--os-line)" }}>
          {runs.length === 0 ? (
            <EmptyHint title="Sem sincronizações ainda" hint="Liga uma plataforma para começar a receber dados reais." />
          ) : (
            runs.map((r) => (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3 border-b last:border-0" style={{ borderColor: "var(--os-line)" }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: r.status === "success" ? "var(--os-green)" : "var(--os-red)" }} />
                <span className="text-[13px] w-[110px] shrink-0">{PROVIDERS.find((p) => p.id === r.provider)?.name ?? r.provider}</span>
                <span className="text-[12px] os-dim flex-1 truncate">{r.message ?? "—"}</span>
                <span className="text-[11px] os-faint shrink-0">{r.records_written} reg · {ago(r.created_at)}</span>
              </div>
            ))
          )}
        </Panel>
      </section>

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditing(null)} />
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-[440px] rounded-2xl os-glass p-5">
            <button className="os-btn !h-8 !w-8 !p-0 justify-center absolute right-4 top-4" onClick={() => setEditing(null)}>
              <X size={13} />
            </button>
            <p className="text-[15px] font-medium">Ligar {editing.name}</p>
            <p className="text-[12px] os-dim mt-1">{editing.description}</p>

            <div className="space-y-3 mt-5">
              {editing.fields.map((f) => (
                <div key={f.key}>
                  <label className="os-label">{f.label}</label>
                  <input
                    type={f.kind === "secret" ? "password" : "text"}
                    autoComplete="off"
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                    className="w-full mt-1.5 h-9 px-3 rounded-lg text-[13px] outline-none"
                    style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--os-line)" }}
                  />
                  {f.hint && <p className="text-[11px] os-faint mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>

            {!editing.live && (
              <p className="text-[11px] os-faint mt-4">
                As credenciais ficam guardadas em segurança. A sincronização automática desta plataforma é ativada assim que a API oficial estiver ligada.
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button className="os-btn os-btn-accent flex-1 justify-center" disabled={busy === editing.id} onClick={submit}>
                {busy === editing.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Guardar e ligar
              </button>
              <button className="os-btn" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
