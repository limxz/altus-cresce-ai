import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export const Panel = ({ children, className = "", ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`os-panel ${className}`} {...rest}>{children}</div>
);

export const SectionTitle = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="flex items-end justify-between gap-4 mb-3">
    <div>
      <h2 className="text-[15px] font-medium tracking-[-0.01em]">{title}</h2>
      {hint && <p className="text-xs os-faint mt-0.5">{hint}</p>}
    </div>
    {action}
  </div>
);

export const Delta = ({ value, invert = false, suffix = "%" }: { value: number | null; invert?: boolean; suffix?: string }) => {
  if (value == null || Number.isNaN(value)) return null;
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  const color = neutral ? "var(--os-faint)" : positive ? "var(--os-green)" : "var(--os-red)";
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color }}>
      <Icon size={12} />{Math.abs(value)}{suffix}
    </span>
  );
};

export const KpiCard = ({
  label, value, unit, delta, invertDelta, hint, icon: Icon,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  delta?: number | null;
  invertDelta?: boolean;
  hint?: string;
  icon: any;
}) => (
  <Panel className="p-4">
    <div className="flex items-center justify-between">
      <span className="os-label">{label}</span>
      <Icon size={14} className="os-faint" />
    </div>
    <div className="mt-3 flex items-baseline gap-1.5">
      <span className="text-[26px] leading-none font-medium tracking-[-0.03em]">
        {value == null || value === "" ? "—" : value}
      </span>
      {unit && value != null && <span className="text-xs os-faint">{unit}</span>}
      <span className="ml-auto"><Delta value={delta ?? null} invert={invertDelta} /></span>
    </div>
    {hint && <p className="text-xs os-faint mt-2">{hint}</p>}
  </Panel>
);

export const Empty = ({ title, hint }: { title: string; hint: string }) => (
  <div className="py-12 text-center">
    <p className="text-sm text-white/90">{title}</p>
    <p className="text-xs os-faint mt-1.5 max-w-sm mx-auto">{hint}</p>
  </div>
);

export const Pill = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) => {
  const color = tone === "good" ? "var(--os-green)" : tone === "warn" ? "var(--os-amber)"
    : tone === "bad" ? "var(--os-red)" : tone === "accent" ? "var(--os-accent)" : "var(--os-dim)";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
      style={{ color, borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      {children}
    </span>
  );
};

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) : "—";

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export const money = (v: number | null | undefined) =>
  v == null ? "—" : `${Number(v).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
