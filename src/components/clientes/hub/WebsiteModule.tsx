import { HubSnapshot } from "@/hooks/useClientHub";
import { Panel, SectionTitle, Empty, fmtDateTime } from "./HubUI";
import { Gauge, Search, Accessibility, ShieldCheck, ExternalLink } from "lucide-react";

const Score = ({ label, value, icon: Icon }: { label: string; value: number | null; icon: any }) => {
  const color = value == null ? "var(--os-faint)" : value >= 90 ? "var(--os-green)" : value >= 50 ? "var(--os-amber)" : "var(--os-red)";
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <span className="os-label">{label}</span>
        <Icon size={14} className="os-faint" />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[28px] leading-none font-medium tracking-[-0.03em]" style={{ color }}>
          {value ?? "—"}
        </span>
        {value != null && <span className="text-xs os-faint">/100</span>}
      </div>
      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${value ?? 0}%`, background: color }} />
      </div>
    </Panel>
  );
};

const WebsiteModule = ({ data }: { data: HubSnapshot }) => {
  const w = data.website;

  if (!w) {
    return (
      <Panel className="p-2">
        <Empty
          title="Website ainda não monitorizado"
          hint="Fala com a equipa Altus para ligarmos o teu site e passares a ver desempenho, SEO e acessibilidade atualizados automaticamente."
        />
      </Panel>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Score label="Desempenho" value={w.performance} icon={Gauge} />
        <Score label="SEO" value={w.seo} icon={Search} />
        <Score label="Acessibilidade" value={w.accessibility} icon={Accessibility} />
        <Score label="Boas práticas" value={w.best_practices} icon={ShieldCheck} />
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <Panel className="p-4">
          <SectionTitle title="Velocidade real" hint="Medições da última análise" />
          <div className="space-y-2 text-[13px]">
            {[
              ["Maior elemento visível (LCP)", w.lcp],
              ["Estabilidade visual (CLS)", w.cls],
              ["Tempo bloqueado (TBT)", w.tbt],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between py-1.5 border-b last:border-0"
                style={{ borderColor: "var(--os-line)" }}>
                <span className="os-dim">{label}</span>
                <span>{(value as string) ?? "—"}</span>
              </div>
            ))}
          </div>
          <p className="text-xs os-faint mt-3">Última análise: {fmtDateTime(w.measured_at)}</p>
        </Panel>

        <Panel className="p-4">
          <SectionTitle title="O teu site" />
          {w.url ? (
            <a href={w.url} target="_blank" rel="noreferrer" className="os-btn">
              <ExternalLink size={13} /> Abrir {w.url.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            <p className="text-xs os-faint">Endereço ainda não configurado.</p>
          )}
          <p className="text-xs os-faint mt-3 leading-relaxed">
            Analisamos o teu site automaticamente e avisamos a equipa sempre que o desempenho desce.
            Todas as melhorias aplicadas ficam registadas na tua linha temporal.
          </p>
        </Panel>
      </section>
    </div>
  );
};

export default WebsiteModule;
