import { Database } from "lucide-react";
import { AltusSource } from "@/hooks/useAltusOS";

/** Source transparency — every AI answer states which real data backed it. */
const SourcesRow = ({ sources, loading }: { sources: AltusSource[]; loading?: boolean }) => {
  if (loading) return <span className="text-xs os-faint">A verificar fontes de dados…</span>;

  const connected = sources.filter((s) => s.status === "connected");
  if (!connected.length) {
    return <span className="text-xs os-faint">Sem fontes de dados ligadas.</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] os-faint inline-flex items-center gap-1"><Database size={11} /> Based on:</span>
      {connected.map((s) => (
        <span
          key={s.key}
          title={s.window}
          className="text-[11px] px-2 py-0.5 rounded-md border os-dim"
          style={{ borderColor: "var(--os-line)" }}
        >
          {s.label} · {s.window}
        </span>
      ))}
    </div>
  );
};

export default SourcesRow;
