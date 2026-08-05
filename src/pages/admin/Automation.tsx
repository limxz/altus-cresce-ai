import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Panel, Label, Skeleton, EmptyHint, severityColor } from "@/components/admin/os/Primitives";
import { CheckCircle2, CircleDashed, RefreshCw, Zap, Clock, AlertTriangle, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

interface Rule {
  id: string;
  name: string;
  trigger_type: string;
  config: Record<string, any>;
  actions: { type: string }[];
  is_active: boolean;
  last_triggered_at: string | null;
  client_id: string | null;
  requires_approval: boolean;
}

interface Approval {
  id: string;
  client_id: string | null;
  trigger_type: string;
  action_type: string;
  title: string;
  detail: string | null;
  status: string;
  created_at: string;
}

interface Run {
  id: string;
  trigger_type: string;
  status: string;
  message: string | null;
  created_at: string;
}

interface Sched {
  id: string;
  provider: string;
  status: string;
  auto_sync: boolean;
  sync_interval_minutes: number;
  next_sync_at: string;
  last_sync_at: string | null;
  failure_count: number;
  last_error: string | null;
  client_id: string;
}

const TRIGGER_LABEL: Record<string, string> = {
  ctr_drop: "CTR em queda",
  lead_no_reply: "Lead sem resposta",
  client_silent: "Cliente sem atividade",
  website_slow: "Website lento",
  spend_no_conversions: "Investimento sem conversões",
  new_leads: "Novos leads",
};

const INTERVALS = [15, 30, 60, 180, 360, 720, 1440];

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const Automation = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [scheds, setScheds] = useState<Sched[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [r, ru, s, c, ap] = await Promise.all([
      supabase.from("automation_rules").select("*").order("created_at"),
      supabase.from("automation_runs").select("id, trigger_type, status, message, created_at").order("created_at", { ascending: false }).limit(25),
      supabase.from("client_integrations").select("id, provider, status, auto_sync, sync_interval_minutes, next_sync_at, last_sync_at, failure_count, last_error, client_id").neq("status", "disconnected"),
      supabase.from("clients").select("id, business_name"),
      supabase.from("automation_approvals")
        .select("id, client_id, trigger_type, action_type, title, detail, status, created_at")
        .order("created_at", { ascending: false }).limit(30),
    ]);
    setApprovals((ap.data ?? []) as Approval[]);
    setRules((r.data ?? []) as unknown as Rule[]);
    setRuns((ru.data ?? []) as Run[]);
    setScheds((s.data ?? []) as unknown as Sched[]);
    setClients(Object.fromEntries((c.data ?? []).map((x: any) => [x.id, x.business_name])));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("os-automation")
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_runs" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_integrations" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_approvals" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const toggleRule = async (rule: Rule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
    await supabase.from("automation_rules").update({ is_active: !rule.is_active }).eq("id", rule.id);
  };

  const toggleApprovalMode = async (rule: Rule) => {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, requires_approval: !r.requires_approval } : r)));
    await supabase.from("automation_rules").update({ requires_approval: !rule.requires_approval }).eq("id", rule.id);
  };

  const decide = async (a: Approval, approved: boolean) => {
    setApprovals((prev) => prev.filter((x) => x.id !== a.id));
    const { error } = await supabase.from("automation_approvals")
      .update({ status: approved ? "approved" : "rejected", decided_at: new Date().toISOString() })
      .eq("id", a.id);
    if (error) { toast({ title: "Não foi possível decidir", description: error.message, variant: "destructive" }); load(); return; }
    if (approved) await supabase.functions.invoke("automation-engine", { body: { action: "execute_approvals" } });
    toast({ title: approved ? "Follow-up aprovado" : "Follow-up rejeitado" });
    load();
  };

  const setInterval_ = async (s: Sched, minutes: number) => {
    setScheds((prev) => prev.map((x) => (x.id === s.id ? { ...x, sync_interval_minutes: minutes } : x)));
    const { error } = await supabase.functions.invoke("integrations", {
      body: { action: "schedule", integration_id: s.id, sync_interval_minutes: minutes },
    });
    if (error) toast({ title: "Não foi possível guardar", description: error.message, variant: "destructive" });
  };

  const toggleAuto = async (s: Sched) => {
    setScheds((prev) => prev.map((x) => (x.id === s.id ? { ...x, auto_sync: !x.auto_sync } : x)));
    await supabase.functions.invoke("integrations", {
      body: { action: "schedule", integration_id: s.id, auto_sync: !s.auto_sync },
    });
  };

  const runNow = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke("automation-engine", { body: { trigger: "manual" } });
    setBusy(false);
    if (error) toast({ title: "Falhou", description: error.message, variant: "destructive" });
    else { toast({ title: "Automações avaliadas", description: "Alertas atualizados com dados reais." }); load(); }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em]">Automação</h1>
          <p className="os-dim text-[14px] mt-1">
            Sincronizações agendadas, regras por evento e histórico de execuções — tudo sobre dados reais.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
        <Link to="/admin/auditoria" className="os-btn">Ver auditoria</Link>
        <button onClick={runNow} disabled={busy} className="os-btn shrink-0">
          {busy ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
          Avaliar agora
        </button>
        </div>
      </header>

      <section className="space-y-3">
        <Label>Sincronizações agendadas</Label>
        {loading ? (
          <Skeleton className="h-[120px] !rounded-2xl" />
        ) : scheds.length === 0 ? (
          <Panel className="p-2">
            <EmptyHint title="Nenhuma integração ligada" hint="Liga Instagram, Meta Ads ou Website em Integrações para o agendamento arrancar." />
          </Panel>
        ) : (
          <div className="space-y-2">
            {scheds.map((s) => (
              <Panel key={s.id} hover className="p-4 flex flex-wrap items-center gap-3.5">
                {s.status === "error" ? (
                  <AlertTriangle size={15} style={{ color: "var(--os-red)" }} />
                ) : (
                  <CheckCircle2 size={15} style={{ color: "var(--os-green)" }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] capitalize">
                    {s.provider.replace("_", " ")} · <span className="os-dim">{clients[s.client_id] ?? "Cliente"}</span>
                  </p>
                  <p className="text-xs os-faint mt-0.5">
                    Última: {fmt(s.last_sync_at)} · Próxima: {fmt(s.next_sync_at)}
                    {s.failure_count > 0 && ` · ${s.failure_count} falhas (backoff ativo)`}
                  </p>
                  {s.last_error && <p className="text-xs mt-1" style={{ color: "var(--os-red)" }}>{s.last_error.slice(0, 140)}</p>}
                </div>
                <select
                  value={s.sync_interval_minutes}
                  onChange={(e) => setInterval_(s, Number(e.target.value))}
                  className="os-btn !px-2.5 text-xs bg-transparent"
                >
                  {INTERVALS.map((m) => (
                    <option key={m} value={m} style={{ background: "#09090b" }}>
                      {m < 60 ? `${m} min` : m === 1440 ? "24 h" : `${m / 60} h`}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => toggleAuto(s)}
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0"
                  style={{
                    background: s.auto_sync ? "rgba(52,211,153,.1)" : "rgba(255,255,255,.04)",
                    color: s.auto_sync ? "var(--os-green)" : "var(--os-faint)",
                  }}
                >
                  {s.auto_sync ? "Auto" : "Manual"}
                </button>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Label>Aprovações pendentes</Label>
        {loading ? (
          <Skeleton className="h-[100px] !rounded-2xl" />
        ) : approvals.filter((a) => a.status === "pending").length === 0 ? (
          <Panel className="p-2">
            <EmptyHint
              title="Nada à espera de ti"
              hint="Follow-ups gerados pelas automações aparecem aqui para aprovares antes de saírem pelas integrações."
            />
          </Panel>
        ) : (
          <div className="space-y-2">
            {approvals.filter((a) => a.status === "pending").map((a) => (
              <Panel key={a.id} hover className="p-4 flex flex-wrap items-center gap-3.5">
                <ShieldCheck size={15} style={{ color: "var(--os-amber, #fbbf24)" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]">{a.title}</p>
                  {a.detail && <p className="text-xs os-dim mt-0.5 line-clamp-2">{a.detail}</p>}
                  <p className="text-xs os-faint mt-0.5">
                    {a.action_type} · {TRIGGER_LABEL[a.trigger_type] ?? a.trigger_type}
                    {clients[a.client_id ?? ""] ? ` · ${clients[a.client_id ?? ""]}` : ""} · {fmt(a.created_at)}
                  </p>
                </div>
                <button onClick={() => decide(a, true)} className="os-btn shrink-0 text-xs">
                  <CheckCircle2 size={12} /> Aprovar
                </button>
                <button onClick={() => decide(a, false)} className="os-btn shrink-0 text-xs">
                  <X size={12} /> Rejeitar
                </button>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Label>Regras por evento</Label>
        {loading ? (
          <Skeleton className="h-[120px] !rounded-2xl" />
        ) : rules.length === 0 ? (
          <Panel className="p-5 space-y-2">
            <p className="text-sm">A correr com as regras padrão do sistema.</p>
            <p className="text-xs os-faint">
              CTR em queda, lead sem resposta há 4h, cliente sem atividade há 7 dias, website lento,
              investimento sem conversões e novos leads por qualificar. Personaliza criando regras próprias.
            </p>
          </Panel>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <Panel key={r.id} hover className="p-4 flex items-center gap-3.5">
                {r.is_active ? (
                  <CheckCircle2 size={15} style={{ color: "var(--os-green)" }} />
                ) : (
                  <CircleDashed size={15} className="os-faint" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]">{r.name}</p>
                  <p className="text-xs os-faint mt-0.5">
                    {TRIGGER_LABEL[r.trigger_type] ?? r.trigger_type} · último disparo {fmt(r.last_triggered_at)}
                  </p>
                </div>
                <button
                  onClick={() => toggleApprovalMode(r)}
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0"
                  title="Follow-ups pelas integrações precisam de aprovação manual"
                  style={{
                    background: r.requires_approval ? "rgba(251,191,36,.12)" : "rgba(255,255,255,.04)",
                    color: r.requires_approval ? "#fbbf24" : "var(--os-faint)",
                  }}
                >
                  {r.requires_approval ? "Requer aprovação" : "Automático"}
                </button>
                <button onClick={() => toggleRule(r)} className="os-btn shrink-0 text-xs">
                  {r.is_active ? "Desativar" : "Ativar"}
                </button>
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Label>Execuções recentes</Label>
        {loading ? (
          <Skeleton className="h-[100px] !rounded-2xl" />
        ) : runs.length === 0 ? (
          <Panel className="p-2">
            <EmptyHint title="Ainda sem execuções" hint="Assim que existirem dados reais, as automações começam a disparar sozinhas." />
          </Panel>
        ) : (
          <Panel className="divide-y" style={{ borderColor: "var(--os-line)" }}>
            {runs.map((run) => (
              <div key={run.id} className="px-4 py-3 flex items-start gap-3">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: severityColor(run.status === "error" ? "critico" : "oportunidade") }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] truncate">{run.message ?? TRIGGER_LABEL[run.trigger_type] ?? run.trigger_type}</p>
                  <p className="text-xs os-faint mt-0.5 flex items-center gap-1.5">
                    <Clock size={10} /> {fmt(run.created_at)} · {TRIGGER_LABEL[run.trigger_type] ?? run.trigger_type}
                  </p>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </section>
    </div>
  );
};

export default Automation;
