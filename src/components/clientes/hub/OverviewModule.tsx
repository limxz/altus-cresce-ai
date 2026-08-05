import { HubSnapshot, Briefing } from "@/hooks/useClientHub";
import { KpiCard, Panel, SectionTitle, Empty, Pill, fmtDateTime, money } from "./HubUI";
import { Users, Target, CalendarDays, Zap, Sparkles, Gauge, Activity, CheckCircle2, AlertTriangle, Clock, ClipboardCheck } from "lucide-react";

const toneOf = (t: string) => (t === "positivo" ? "good" : t === "atencao" ? "warn" : "neutral") as any;

const OverviewModule = ({
  data, briefing, onNavigate,
}: { data: HubSnapshot; briefing: Briefing | null; onNavigate: (m: string) => void }) => {
  const k = data.kpis;
  const hasSignups = (data.signups?.total ?? 0) > 0;

  return (
    <div className="space-y-8">
      <section className={`grid grid-cols-2 gap-3 ${hasSignups ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {hasSignups && (
          <KpiCard label="Inscrições (7 dias)" value={data.signups!.last7} delta={data.signups!.delta} icon={ClipboardCheck}
            hint={`${data.signups!.total} inscrições nos últimos 60 dias`} />
        )}
        <KpiCard label="Leads (7 dias)" value={k.leads.value} delta={k.leads.delta} icon={Users}
          hint="Conversas iniciadas por potenciais clientes" />
        <KpiCard label="Conversões (7 dias)" value={k.conversions.value} delta={k.conversions.delta} icon={Target}
          hint={data.ads.cpa ? `Custo por conversão ${money(data.ads.cpa)}` : "Sem campanhas ativas"} />
        <KpiCard label="Reuniões marcadas" value={k.meetings.value} icon={CalendarDays}
          hint="Próximas sessões com a equipa Altus" />
        <KpiCard label="Sistemas ligados" value={k.campaigns.value} icon={Zap}
          hint="Integrações a alimentar o teu painel" />
      </section>


      <section>
        <SectionTitle title="O teu briefing de hoje" hint="Gerado pela IA da Altus com base nos dados reais das últimas semanas" />
        <Panel className="p-5">
          {!briefing ? (
            <div className="flex items-center gap-2 text-sm os-dim">
              <Sparkles size={14} className="animate-pulse" style={{ color: "var(--os-accent)" }} />
              A analisar os teus dados…
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[15px] leading-snug">{briefing.headline}</p>
              <ul className="space-y-2">
                {briefing.bullets?.map((b, i) => (
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
        </Panel>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Panel className="p-4 lg:col-span-2">
          <SectionTitle title="O que a Altus fez por ti" hint="Cada sincronização, automação e ação executada" />
          {data.timeline.length === 0 ? (
            <Empty title="Ainda sem registos" hint="Assim que ligarmos as tuas contas, todo o trabalho aparece aqui em tempo real." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--os-line)" }}>
              {data.timeline.slice(0, 8).map((t) => {
                const bad = t.status === "error" || t.status === "failed";
                return (
                  <div key={t.id} className="py-2.5 flex items-start gap-2.5">
                    {bad
                      ? <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--os-amber)" }} />
                      : <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: "var(--os-green)" }} />}
                    <div className="min-w-0">
                      <p className="text-[13px] truncate">{t.title}</p>
                      <p className="text-xs os-faint mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {fmtDateTime(t.at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <SectionTitle title="Saúde do negócio" />
            {k.health.value == null ? (
              <p className="text-xs os-faint">Disponível assim que houver dados suficientes.</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-[34px] leading-none font-medium tracking-[-0.03em]">{k.health.value}</span>
                  <span className="text-xs os-faint">/ 100</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${k.health.value}%`,
                    background: k.health.value >= 70 ? "var(--os-green)" : k.health.value >= 45 ? "var(--os-amber)" : "var(--os-red)",
                  }} />
                </div>
                <p className="text-xs os-faint mt-2">Combina desempenho do site, anúncios, leads e redes sociais.</p>
              </>
            )}
          </Panel>

          <Panel className="p-4">
            <SectionTitle title="Atalhos" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "resultados", label: "Resultados", icon: Activity },
                { key: "leads", label: "Leads", icon: Users },
                { key: "website", label: "Website", icon: Gauge },
                { key: "assistente", label: "Assistente IA", icon: Sparkles },
              ].map((s) => (
                <button key={s.key} onClick={() => onNavigate(s.key)} className="os-btn justify-center">
                  <s.icon size={13} /> {s.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {data.recommendations.length > 0 && (
        <section>
          <SectionTitle title="Próximos passos recomendados" hint="Prioridades sugeridas pela IA a partir dos teus números" />
          <div className="grid md:grid-cols-2 gap-3">
            {(data.recommendations[0]?.recommendations ?? []).slice(0, 4).map((r: any, i: number) => (
              <Panel key={i} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium">{r.title}</p>
                  <Pill tone={r.priority === "alta" ? "bad" : r.priority === "media" ? "warn" : "good"}>
                    {r.priority}
                  </Pill>
                </div>
                <p className="text-xs os-dim mt-1.5 leading-relaxed">{r.description}</p>
              </Panel>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default OverviewModule;
