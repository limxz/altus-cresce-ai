import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, Label, Skeleton, EmptyHint, severityColor } from "@/components/admin/os/Primitives";
import { RefreshCw, Clock, ShieldCheck, Plug, Workflow, Bot, Download } from "lucide-react";

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

const Audit = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [clients, setClients] = useState<{ id: string; business_name: string }[]>([]);
  const [integrations, setIntegrations] = useState<{ id: string; provider: string; client_id: string }[]>([]);
  const [clientId, setClientId] = useState("all");
  const [integrationId, setIntegrationId] = useState("all");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [a, s, r, c, i] = await Promise.all([
      supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("integration_sync_runs").select("*").order("created_at", { ascending: false }).limit(150),
      supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(150),
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

  useEffect(() => {
    load();
    const channel = supabase
      .channel("os-audit")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const visibleIntegrations = useMemo(
    () => integrations.filter((i) => clientId === "all" || i.client_id === clientId),
    [integrations, clientId],
  );

  const filtered = useMemo(
    () => entries.filter((e) =>
      (clientId === "all" || e.client_id === clientId) &&
      (integrationId === "all" || e.integration_id === integrationId) &&
      (type === "all" ||
        (type === "sync" && e.action_type === "sync") ||
        (type === "automation" && e.action_type.startsWith("automation")) ||
        (type === "approval" && (e.action_type.startsWith("approval") || e.action_type.startsWith("action:"))) ||
        (type === "error" && (e.status === "error" || e.status === "failed"))),
    ),
    [entries, clientId, integrationId, type],
  );

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.business_name ?? null;

  const exportCsv = () => {
    const rows = [
      ["data", "cliente", "tipo", "estado", "titulo", "detalhe"],
      ...filtered.map((e) => [
        new Date(e.created_at).toISOString(), clientName(e.client_id) ?? "", e.action_type, e.status,
        e.title, (e.detail ?? "").replace(/\s+/g, " "),
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

  const select = "os-btn !px-2.5 text-xs bg-transparent";
  const opt = { background: "#09090b" };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em]">Auditoria</h1>
          <p className="os-dim text-[14px] mt-1">
            Rasto completo de cada sincronização, automação e ação executada — filtrável por cliente e integração.
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

      <section className="flex flex-wrap gap-2">
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
          <option value="error" style={opt}>Apenas erros</option>
        </select>
        <span className="text-xs os-faint self-center ml-1">{filtered.length} registos</span>
      </section>

      <section className="space-y-3">
        <Label>Linha temporal</Label>
        {loading ? (
          <Skeleton className="h-[240px] !rounded-2xl" />
        ) : filtered.length === 0 ? (
          <Panel className="p-2">
            <EmptyHint title="Sem registos" hint="Assim que existirem sincronizações ou automações, tudo fica registado aqui." />
          </Panel>
        ) : (
          <Panel className="divide-y" style={{ borderColor: "var(--os-line)" }}>
            {filtered.map((e) => {
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
