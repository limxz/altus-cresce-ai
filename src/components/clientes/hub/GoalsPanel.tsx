import { Target } from "lucide-react";
import { Panel } from "./HubUI";

interface Goal {
  id: string;
  label: string;
  metric: string;
  unit: string | null;
  target: number;
  current_value: number;
  progress: number | null;
  deadline: string | null;
}

const GoalsPanel = ({ goals, loading }: { goals: Goal[]; loading?: boolean }) => {
  if (loading) return null;

  return (
    <section>
      <div className="mb-3">
        <h3 className="text-[15px] font-medium tracking-[-0.01em]">Goals</h3>
        <p className="text-xs os-faint mt-0.5">Objetivos definidos com a equipa Altus</p>
      </div>

      {goals.length === 0 ? (
        <Panel className="p-5">
          <p className="text-sm os-dim">Ainda não há objetivos definidos.</p>
          <p className="text-xs os-faint mt-1">
            Assim que a equipa Altus definir os teus objetivos, o progresso aparece aqui automaticamente.
          </p>
        </Panel>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((g) => {
            const progress = g.progress ?? 0;
            const tone = progress >= 85 ? "var(--os-green)" : progress >= 45 ? "var(--os-accent)" : "var(--os-amber)";
            return (
              <Panel key={g.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="os-label">Goal</span>
                  <Target size={14} className="os-faint" />
                </div>
                <p className="text-[13px] mt-2.5">{g.label}</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-[24px] leading-none font-medium tracking-[-0.03em]">
                    {Number(g.current_value).toLocaleString("pt-PT")}
                  </span>
                  <span className="text-xs os-faint">
                    / {Number(g.target).toLocaleString("pt-PT")} {g.unit ?? ""}
                  </span>
                  <span className="ml-auto text-xs font-medium" style={{ color: tone }}>{progress}%</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, progress)}%`, background: tone }} />
                </div>
                {g.deadline && (
                  <p className="text-xs os-faint mt-2">
                    Prazo · {new Date(g.deadline).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                  </p>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default GoalsPanel;
