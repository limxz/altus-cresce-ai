import { Panel, Label } from "@/components/admin/os/Primitives";
import { CheckCircle2, CircleDashed } from "lucide-react";

interface Job {
  name: string;
  detail: string;
  status: "ativo" | "por-ligar";
}

const JOBS: Job[] = [
  { name: "Sincronização diária de métricas", detail: "sync-client-data · 06:00 UTC · Instagram + Meta Ads", status: "ativo" },
  { name: "Recomendações de IA", detail: "generate-recommendations · a pedido por cliente", status: "ativo" },
  { name: "Briefing operacional", detail: "altus-intelligence · gerado a cada abertura da Home", status: "ativo" },
  { name: "Agentes WhatsApp", detail: "whatsapp-multi-agent · respostas automáticas por cliente", status: "ativo" },
  { name: "Onboarding de cliente", detail: "on-client-created · credenciais por email", status: "ativo" },
  { name: "Relatório mensal", detail: "generate-monthly-report · envio automático", status: "ativo" },
  { name: "Google Search Console", detail: "Indexação, queries e posições médias", status: "por-ligar" },
  { name: "Stripe", detail: "Receita, pagamentos pendentes e churn", status: "por-ligar" },
  { name: "Calendário", detail: "Reuniões marcadas e no-shows", status: "por-ligar" },
];

const Automation = () => (
  <div className="space-y-7">
    <header>
      <h1 className="text-[22px] font-medium tracking-[-0.02em]">Automação</h1>
      <p className="os-dim text-[14px] mt-1">Tudo o que corre sozinho — e o que falta ligar.</p>
    </header>

    <section className="space-y-3">
      <Label>Rotinas</Label>
      <div className="space-y-2">
        {JOBS.map((j) => (
          <Panel key={j.name} hover className="p-4 flex items-center gap-3.5">
            {j.status === "ativo" ? (
              <CheckCircle2 size={15} style={{ color: "var(--os-green)" }} />
            ) : (
              <CircleDashed size={15} className="os-faint" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[14px]">{j.name}</p>
              <p className="text-xs os-faint mt-0.5">{j.detail}</p>
            </div>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md shrink-0"
              style={{
                background: j.status === "ativo" ? "rgba(52,211,153,.1)" : "rgba(255,255,255,.04)",
                color: j.status === "ativo" ? "var(--os-green)" : "var(--os-faint)",
              }}
            >
              {j.status === "ativo" ? "Ativo" : "Por ligar"}
            </span>
          </Panel>
        ))}
      </div>
    </section>
  </div>
);

export default Automation;
