import { ReactNode } from "react";

export const Panel = ({
  children,
  className = "",
  hover = false,
  ...rest
}: { children: ReactNode; className?: string; hover?: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`os-panel ${hover ? "os-panel-hover" : ""} ${className}`} {...rest}>
    {children}
  </div>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`os-skel ${className}`} />
);

export const Label = ({ children }: { children: ReactNode }) => (
  <span className="os-label">{children}</span>
);

export const HealthRing = ({ value, size = 44 }: { value: number; size?: number }) => {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 70 ? "var(--os-green)" : value >= 45 ? "var(--os-amber)" : "var(--os-red)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="os-ring" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.07)" strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-medium"
        style={{ fontSize: size * 0.28, color }}
      >
        {value}
      </span>
    </div>
  );
};

export const severityColor = (s: string) =>
  s === "critico" ? "var(--os-red)" : s === "atencao" ? "var(--os-amber)" : s === "oportunidade" ? "var(--os-green)" : "var(--os-accent)";

export const EmptyHint = ({ title, hint }: { title: string; hint: string }) => (
  <div className="py-10 text-center">
    <p className="text-sm text-white/90">{title}</p>
    <p className="text-xs os-faint mt-1.5">{hint}</p>
  </div>
);
