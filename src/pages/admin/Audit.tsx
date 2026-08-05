import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, Label, Skeleton, EmptyHint, severityColor } from "@/components/admin/os/Primitives";
import { RefreshCw, Clock, ShieldCheck, Plug, Workflow, Bot, Download, Search, Mail, Send, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Entry {
  id: string;
  created_at: string;
  actor: string;
  action_type: string;
  provider: string | null;
  status: string;
  title: string;
  detail: string | null;
  client_id: string | null;
  integration_id: string | null;
  source: "audit" | "sync" | "automation";
  duration_ms?: number | null;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const iconFor = (e: Entry) => {
  if (e.source === "sync" || e.action_type === "sync") return Plug;
  if (e.action_type.startsWith("approval") || e.action_type.startsWith("action:")) return ShieldCheck;
  if (e.source === "automation") return Workflow;
  return Bot;
};

const statusColor = (s: string) =>
  s === "error" || s === "failed" ? severityColor("critico")
    : s === "pending" ? severityColor("atencao")
    : severityColor("oportunidade");

/** Higher = more relevant when sorting by impact. */
const impactScore = (e: Entry) => {
  let score = 0;
  if (e.status === "error" || e.status === "failed") score += 100;
  if (e.status === "pending") score += 60;
  if (e.action_type.startsWith("approval") || e.action_type.startsWith("action:")) score += 25;
  if (e.source === "automation") score += 15;
  if (e.action_type === "sync" && e.status !== "success") score += 10;
  const ageHours = (Date.now() - +new Date(e.created_at)) / 36e5;
  return score + Math.max(0, 24 - ageHours) / 24;
};

const Audit = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [integrations, setIntegrations] = useState<{ id: string; provider: string; client_id: string }[]>([]);
  const [clientId, setClientId] = useState("all");
  const [integrationId, setIntegrationId] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [actor, setActor] = useState("all");
  const [range, setRange] = useState("14");
  const [sort, setSort] = useState<"recent" | "impact" | "duration">("recent");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // scheduled export settings
  const [orgId, setOrgId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [recipientsInput, setRecipientsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [a, s, r, c, i] = await Promise.all([
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("integration_sync_runs").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("clients").select("id, business_name").order("business_name"),
      supabase.from("client_integrations").select("id, provider, client_id"),
    ]);

    const merged: Entry[] = [
      ...((a.data ?? []) as any[]).map((x) => ({ ...x, source: "audit" as const })),
      ...((s.data ?? []) as any[]).map((x) => ({
        id: `s-${x.id}`, created_at: x.created_at, actor: "system", action_type: "sync",
        provider: x.provider, status: x.status,
        title: `Sincronização ${x.status === "error" ? "falhou" : "concluída"} · ${x.provider}`,
        detail: x.message, client_id: x.client_id, integration_id: x.integration_id,
        duration_ms: x.duration_ms, source: "sync" as const,
      })),
      ...((r.data ?? []) as any[]).map((x) => ({
        id: `r-${x.id}`, created_at: x.created_at, actor: "system", action_type: `automation:${x.trigger_type}`,
        provider: null, status: x.status, title: x.message ?? x.trigger_type,
        detail: (x.payload as any)?.detail ?? null, client_id: x.client_id, integration_id: null,
        source: "automation" as const,
      })),
    ].sort((x, y) => +new Date(y.created_at) - +new Date(x.created_at));

    setEntries(merged);
    setClients((c.data ?? []) as any);
    setIntegrations((i.data ?? []) as any);
    setLoading(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data: member } = await supabase.from("organization_members").select("organization_id").limit(1).maybeSingle();
    const org = member?.organization_id ?? null;
    setOrgId(org);
    if (!org) return;
    const { data } = await supabase.from("audit_export_settings").select("*").eq("organization_id", org).maybeSingle();
    if (data) {
      setSettings(data);
      setRecipientsInput((data.recipients ?? []).join(", "));
    } else {
      setSettings({ organization_id: org, enabled: false, frequency: "daily", recipients: [], send_hour_utc: 6 });
    }
  }, []);

  useEffect(() => {
    load();
    loadSettings();
    const channel = supabase
      .channel("os-audit")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, loadSettings]);

  const visibleIntegrations = useMemo(
    () => integrations.filter((i) => clientId === "all" || i.client_id === clientId),
    [integrations, clientId],
  );

  const clientName = useCallback(
    (id: string | null) => clients.find((c) => c.id === id)?.business_name ?? null,
    [clients],
  );

  const filtered = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const since = range === "all" ? 0 : Date.now() - Number(range) * 864e5;

    const out = entries.filter((e) => {
      if (clientId !== "all" && e.client_id !== clientId) return false;
      if (integrationId !== "all" && e.integration_id !== integrationId) return false;
      if (actor !== "all" && e.actor !== actor) return false;
      if (since && +new Date(e.created_at) < since) return false;
      if (status !== "all") {
        if (status === "error" && !(e.status === "error" || e.status === "failed")) return false;
        if (status !== "error" && e.status !== status) return false;
      }
      if (type !== "all") {
        const ok =
          (type === "sync" && e.action_type === "sync") ||
          (type === "automation" && e.action_type.startsWith("automation")) ||
          (type === "approval" && (e.action_type.startsWith("approval") || e.action_type.startsWith("action:"))) ||
          (type === "ai" && (e.action_type.includes("report") || e.action_type.includes("agent") || e.action_type.includes("recommend")));
        if (!ok) return false;
      }
      if (terms.length) {
        const haystack = [
          e.title, e.detail, e.action_type, e.provider, e.status, e.actor, clientName(e.client_id),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!terms.every((t) => haystack.includes(t))) return false;
      }
      return true;
    });

    if (sort === "impact") out.sort((a, b) => impactScore(b) - impactScore(a));
    else if (sort === "duration") out.sort((a, b) => (b.duration_ms ?? 0) - (a.duration_ms ?? 0));
    else out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    return out;
  }, [entries, clientId, integrationId, type, status, actor, range, q, sort, clientName]);

  const counters = useMemo(() => ({
    total: filtered.length,
    errors: filtered.filter((e) => e.status === "error" || e.status === "failed").length,
    pending: filtered.filter((e) => e.status === "pending").length,
  }), [filtered]);

  const exportCsv = () => {
    const rows = [
      ["data", "cliente", "tipo", "estado", "ator", "titulo", "detalhe", "duracao_ms"],
      ...filtered.map((e) => [
        new Date(e.created_at).toISOString(), clientName(e.client_id) ?? "", e.action_type, e.status, e.actor,
        e.title, (e.detail ?? "").replace(/\s+/g, " "), e.duration_ms ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria-altus-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSettings = async () => {
    if (!orgId) return;
    setSaving(true);
    const recipients = recipientsInput.split(/[,;\s]+/).map((s) => s.trim()).filter((s) => s.includes("@"));
    const payload = {
      organization_id: orgId,
      enabled: !!settings.enabled,
      frequency: settings.frequency ?? "daily",
      send_hour_utc: Number(settings.send_hour_utc ?? 6),
      recipients,
    };
    const { data, error } = await supabase
      .from("audit_export_settings")
      .upsert(payload, { onConflict: "organization_id" })
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) return toast({ title: "Não foi possível guardar", description: error.message, variant: "destructive" });
    setSettings(data);
    setRecipientsInput(recipients.join(", "));
    toast({ title: "Exportação agendada guardada" });
  };

  const sendNow = async () => {
    if (!orgId) return;
    setSending(true);
    const { data, error } = await supabase.functions.invoke("audit-exporter", {
      body: { organization_id: orgId, force: true },
    });
    setSending(false);
    const result = (data as any)?.results?.[0];
    if (error || result?.error) {
      return toast({
        title: "Envio falhou",
        description: result?.error ?? error?.message ?? "Erro desconhecido",
        variant: "destructive",
      });
    }
    if (result?.skipped) return toast({ title: "Nada enviado", description: result.skipped });
    toast({ title: "CSV enviado", description: `${result?.rows ?? 0} registos enviados por email.` });
    loadSettings();
  };

  const select = "os-btn !px-2.5 text-xs bg-transparent";
  const opt = { background: "#09090b" };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em]">Auditoria</h1>
          <p className="os-dim text-[14px] mt-1">
            Rasto completo de cada sincronização, automação e ação — com pesquisa avançada e exportação automática.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={exportCsv} className="os-btn" disabled={!filtered.length}>
            <Download size={13} /> Exportar
          </button>
          <button onClick={load} className="os-btn">
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </header>

      {/* Scheduled export */}
      <section className="space-y-3">
        <Label>Exportação automática por email</Label>
        <Panel className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSettings((s: any) => ({ ...s, enabled: !s?.enabled }))}
              className="os-btn"
              style={settings?.enabled ? { borderColor: "var(--os-green)", color: "var(--os-green)" } : undefined}
            >
              <Mail size={13} /> {settings?.enabled ? "Ativa" : "Desativada"}
            </button>
            <select
              value={settings?.frequency ?? "daily"}
              onChange={(e) => setSettings((s: any) => ({ ...s, frequency: e.target.value }))}
              className={select}
            >
              <option value="daily" style={opt}>Diária</option>
              <option value="weekly" style={opt}>Semanal (segunda-feira)</option>
            </select>
            <select
              value={String(settings?.send_hour_utc ?? 6)}
              onChange={(e) => setSettings((s: any) => ({ ...s, send_hour_utc: Number(e.target.value) }))}
              className={select}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h} style={opt}>{String(h).padStart(2, "0")}:00 UTC</option>
              ))}
            </select>
            <input
              value={recipientsInput}
              onChange={(e) => setRecipientsInput(e.target.value)}
              placeholder="emails separados por vírgula"
              className="os-input flex-1 min-w-[220px] text-xs bg-transparent border rounded-lg px-3 py-2"
              style={{ borderColor: "var(--os-line)" }}
            />
            <button onClick={saveSettings} disabled={saving} className="os-btn">
              {saving ? "A guardar…" : "Guardar"}
            </button>
            <button onClick={sendNow} disabled={sending} className="os-btn">
              <Send size={13} /> {sending ? "A enviar…" : "Enviar agora"}
            </button>
          </div>
          <p className="text-xs os-faint">
            {settings?.last_sent_at
              ? `Último envio: ${fmt(settings.last_sent_at)} · ${settings.last_status === "error" ? `falhou (${settings.last_error})` : "sucesso"}`
              : "Ainda não foi enviado nenhum relatório."}
          </p>
        </Panel>
      </section>

      {/* Advanced search */}
      <section className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 os-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar em títulos, detalhes, providers, clientes…"
            className="w-full bg-transparent border rounded-xl pl-9 pr-9 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--os-line)" }}
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 os-faint">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={clientId} onChange={(e) => { setClientId(e.target.value); setIntegrationId("all"); }} className={select}>
            <option value="all" style={opt}>Todos os clientes</option>
            {clients.map((c) => <option key={c.id} value={c.id} style={opt}>{c.business_name}</option>)}
          </select>
          <select value={integrationId} onChange={(e) => setIntegrationId(e.target.value)} className={select}>
            <option value="all" style={opt}>Todas as integrações</option>
            {visibleIntegrations.map((i) => (
              <option key={i.id} value={i.id} style={opt}>
                {i.provider.replace("_", " ")}{clientName(i.client_id) ? ` · ${clientName(i.client_id)}` : ""}
              </option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={select}>
            <option value="all" style={opt}>Todos os eventos</option>
            <option value="sync" style={opt}>Sincronizações</option>
            <option value="automation" style={opt}>Automações</option>
            <option value="approval" style={opt}>Aprovações e ações</option>
            <option value="ai" style={opt}>IA e relatórios</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={select}>
            <option value="all" style={opt}>Qualquer estado</option>
            <option value="success" style={opt}>Sucesso</option>
            <option value="error" style={opt}>Falhas</option>
            <option value="pending" style={opt}>Pendentes</option>
            <option value="skipped" style={opt}>Ignorados</option>
          </select>
          <select value={actor} onChange={(e) => setActor(e.target.value)} className={select}>
            <option value="all" style={opt}>Qualquer ator</option>
            <option value="system" style={opt}>Sistema</option>
            <option value="user" style={opt}>Utilizador</option>
            <option value="ai" style={opt}>IA</option>
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} className={select}>
            <option value="1" style={opt}>Últimas 24h</option>
            <option value="7" style={opt}>7 dias</option>
            <option value="14" style={opt}>14 dias</option>
            <option value="30" style={opt}>30 dias</option>
            <option value="all" style={opt}>Tudo</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className={select}>
            <option value="recent" style={opt}>Mais recentes</option>
            <option value="impact" style={opt}>Maior impacto</option>
            <option value="duration" style={opt}>Mais lentos</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 text-xs os-faint">
          <span>{counters.total} registos</span>
          <span style={{ color: severityColor("critico") }}>{counters.errors} falhas</span>
          <span style={{ color: severityColor("atencao") }}>{counters.pending} pendentes</span>
        </div>
      </section>

      <section className="space-y-3">
        <Label>Linha temporal</Label>
        {loading ? (
          <Skeleton className="h-[240px] !rounded-2xl" />
        ) : filtered.length === 0 ? (
          <Panel className="p-2">
            <EmptyHint title="Sem registos" hint="Ajusta os filtros ou aguarda por novas sincronizações e automações." />
          </Panel>
        ) : (
          <Panel className="divide-y" style={{ borderColor: "var(--os-line)" }}>
            {filtered.slice(0, 300).map((e) => {
              const Icon = iconFor(e);
              return (
                <div key={e.id} className="px-4 py-3 flex items-start gap-3">
                  <Icon size={14} className="mt-0.5 shrink-0" style={{ color: statusColor(e.status) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]">{e.title}</p>
                    {e.detail && <p className="text-xs os-dim mt-0.5 line-clamp-2">{e.detail}</p>}
                    <p className="text-xs os-faint mt-1 flex flex-wrap items-center gap-1.5">
                      <Clock size={10} /> {fmt(e.created_at)}
                      {clientName(e.client_id) && <> · {clientName(e.client_id)}</>}
                      {" · "}{e.action_type}
                      {e.provider && <> · {e.provider.replace("_", " ")}</>}
                      {" · "}{e.actor}
                      {typeof e.duration_ms === "number" && <> · {e.duration_ms} ms</>}
                    </p>
                  </div>
                </div>
              );
            })}
          </Panel>
        )}
      </section>
    </div>
  );
};

export default Audit;
