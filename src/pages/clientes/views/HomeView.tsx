import { Sparkles, AlertTriangle, CheckCircle2, Clock, Users, Target, CalendarDays, Zap, ClipboardCheck, ArrowRight, HelpCircle } from "lucide-react";
import { usePortal } from "../ClientPortal";
import { Panel, Empty, Delta, fmtDateTime, money } from "@/components/clientes/hub/HubUI";
import { Skeleton } from "@/components/admin/os/Primitives";
import GoalsPanel from "@/components/clientes/hub/GoalsPanel";
import SourcesRow from "@/components/clientes/hub/SourcesRow";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 6) return "Boa noite";
  if (h < 13) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
};

const Metric = ({
  label, value, unit, delta, invert, hint, icon: Icon, onWhy,
}: {
  label: string; value: string | number | null; unit?: string; delta?: number | null;
  invert?: boolean; hint?: string; icon: any; onWhy?: () => void;
}) => (
  <Panel className="p-4 group">
    <div className="flex items-center justify-between">
      <span className="os-label">{label}</span>
      <Icon size={14} className="os-faint" />
    </div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className="text-[26px] leading-none font-medium tracking-[-0.03em]">
        {value == null || value === "" ? "—" : value}
      </span>
      {unit && value != null && <span className="text-xs os-faint">{unit}</span>}
      <span className="ml-auto"><Delta value={delta ?? null} invert={invert} /></span>
    </div>
    <div className="mt-2 flex items-center gap-2 min-h-[18px]">
      {hint && <p className="text-xs os-faint">{hint}</p>}
      {onWhy && value != null && (
        <button
          onClick={onWhy}
          className="ml-auto text-[11px] inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--os-accent)" }}
        >
          <HelpCircle size={11} /> Porquê?
        </button>
      )}
    </div>
  </Panel>
);

const HomeView = () => {
  const { data, briefing, loading, context, contextLoading, go } = usePortal();

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[64px] !rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[110px] !rounded-2xl" />)}
        </div>
        <Skeleton className="h-[220px] !rounded-2xl" />
        <p className="text-xs os-faint text-center">A analisar o teu negócio…</p>
      </div>
    );
  }

  const k = data.kpis;
  const hasSignups = (data.signups?.total ?? 0) > 0;
  const askWhy = (metric: string) => go(`altusos?q=${encodeURIComponent(`Porque é que ${metric} está neste valor?`)}`);

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h2 className="text-[26px] leading-tight font-medium tracking-[-0.03em]">
          {greeting()}, {data.client.business_name}.
        </h2>
        <p className="text-sm os-dim">Aqui está o que está a acontecer com o teu negócio.</p>
      </header>

      <section className={`grid grid-cols-2 gap-3 ${hasSignups ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {hasSignups && (
          <Metric label="Inscrições · 7 dias" value={data.signups!.last7} delta={data.signups!.delta} icon={ClipboardCheck}
            hint={`${data.signups!.total} em 60 dias`} onWhy={() => askWhy("o número de inscrições")} />
        )}
        <Metric label="Leads · 7 dias" value={k.leads.value} delta={k.leads.delta} icon={Users}
          hint="Conversas iniciadas" onWhy={() => askWhy("o número de leads")} />
        <Metric label="Conversões · 7 dias" value={k.conversions.value} delta={k.conversions.delta} icon={Target}
          hint={data.ads.cpa ? `CPL ${money(data.ads.cpa)}` : "Sem campanhas ativas"} onWhy={() => askWhy("o CPL")} />
        <Metric label="Reuniões marcadas" value={k.meetings.value} icon={CalendarDays} hint="Próximas sessões" />
        <Metric label="Sistemas ligados" value={k.campaigns.value} icon={Zap} hint="Integrações ativas" />
      </section>

      <section>
        <Panel className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: "var(--os-accent)" }} />
            <span className="os-label">AI Summary</span>
            {context && (
              <span className="ml-auto text-[11px] os-faint">
                Confiança: {context.confidence === "alta" ? "Alta" : context.confidence === "media" ? "Média" : "Baixa"}
              </span>
            )}
          </div>

          {!briefing ? (
            <p className="text-sm os-dim flex items-center gap-2">
              <Sparkles size={13} className="animate-pulse" style={{ color: "var(--os-accent)" }} />
              A analisar os dados disponíveis…
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-[15px] leading-snug">{briefing.headline}</p>
              <ul className="space-y-2">
                {briefing.bullets?.map((b: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] os-dim">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{
                      background: b.tone === "positivo" ? "var(--os-green)" : b.tone === "atencao" ? "var(--os-amber)" : "var(--os-accent)",
                    }} />
                    <span>{b.text}</span>
                  </li>
                ))}
              </ul>
              {briefing.risk && (
                <div className="flex items-start gap-2 pt-3 border-t text-[13px]" style={{ borderColor: "var(--os-line)" }}>
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--os-amber)" }} />
                  <span className="os-dim">{briefing.risk}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t flex flex-wrap items-center gap-3" style={{ borderColor: "var(--os-line)" }}>
            <SourcesRow sources={context?.sources ?? []} loading={contextLoading} />
            <button onClick={() => go("altusos")} className="os-btn ml-auto text-xs">
              Perguntar ao AltusOS <ArrowRight size={13} />
            </button>
          </div>
        </Panel>
      </section>

      <GoalsPanel goals={context?.goals ?? []} loading={contextLoading} />

      <section className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-4 lg:col-span-2">
          <div className="mb-3">
            <h3 className="text-[15px] font-medium tracking-[-0.01em]">O que aconteceu</h3>
            <p className="text-xs os-faint mt-0.5">Todas as ações da equipa Altus e do sistema</p>
          </div>
          {data.timeline.length === 0 ? (
            <Empty title="Ainda sem registos" hint="Assim que ligarmos as tuas contas, todo o trabalho aparece aqui em tempo real." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--os-line)" }}>
              {data.timeline.slice(0, 8).map((t: any) => {
                const bad = t.status === "error" || t.status === "failed";
                return (
                  <div key={t.id} className="py-2.5 flex items-start gap-2.5">
                    {bad
                      ? <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--os-amber)" }} />
                      : <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "var(--os-green)" }} />}
                    <div className="min-w-0">
                      <p className="text-[13px] truncate">{t.title}</p>
                      <p className="text-xs os-faint mt-0.5 flex items-center gap-1"><Clock size={10} /> {fmtDateTime(t.at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <h3 className="text-[15px] font-medium tracking-[-0.01em] mb-3">Growth Score</h3>
            {k.health.value == null ? (
              <p className="text-xs os-faint">
                Ainda não há dados suficientes ligados para calcular o teu Growth Score.
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[34px] leading-none font-medium tracking-[-0.03em]">{k.health.value}</span>
                  <span className="text-xs os-faint">/ 100</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${k.health.value}%`,
                    background: k.health.value >= 70 ? "var(--os-green)" : k.health.value >= 45 ? "var(--os-amber)" : "var(--os-red)",
                  }} />
                </div>
                <p className="text-xs os-faint mt-2">
                  Baseado apenas nas fontes ligadas · {context?.dataDepthDays ?? 0} dias de histórico
                </p>
              </>
            )}
          </Panel>

          {(context?.missing?.length ?? 0) > 0 && (
            <Panel className="p-4">
              <h3 className="text-[15px] font-medium tracking-[-0.01em]">Por ligar</h3>
              <p className="text-xs os-faint mt-0.5 mb-3">Cada ligação desbloqueia mais inteligência.</p>
              <div className="flex flex-wrap gap-1.5">
                {context!.missing.slice(0, 8).map((m) => (
                  <span key={m.provider} className="text-[11px] px-2 py-1 rounded-md border os-faint"
                    style={{ borderColor: "var(--os-line)" }}>
                    {m.label} · Not connected
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomeView;
