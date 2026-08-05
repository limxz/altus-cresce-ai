import { useMemo, useState } from "react";
import { HubNotification, HubSnapshot } from "@/hooks/useClientHub";
import { Panel, SectionTitle, Empty, Pill, fmtDateTime } from "./HubUI";
import {
  AlertTriangle, Users, Megaphone, Globe, Sparkles, CalendarDays, CreditCard,
  Bell, CheckCheck, Check,
} from "lucide-react";

type Filter = "todos" | "nao_lidos" | "lead" | "campanha" | "website" | "ia" | "reuniao" | "pagamento" | "problema";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "nao_lidos", label: "Por ler" },
  { key: "lead", label: "Leads" },
  { key: "campanha", label: "Campanhas" },
  { key: "website", label: "Website" },
  { key: "ia", label: "Recomendações IA" },
  { key: "reuniao", label: "Reuniões" },
  { key: "pagamento", label: "Pagamentos" },
  { key: "problema", label: "Problemas" },
];

/** Maps the backend `category` strings onto the portal's user-facing groups. */
const groupOf = (n: HubNotification): Filter => {
  const c = (n.category ?? "").toLowerCase();
  if (n.severity === "critico" || c.includes("erro") || c.includes("sync") || c.includes("integra")) return "problema";
  if (c.includes("lead") || c.includes("inscri") || c.includes("conversa") || c.includes("whatsapp")) return "lead";
  if (c.includes("ads") || c.includes("campanha") || c.includes("meta") || c.includes("instagram")) return "campanha";
  if (c.includes("site") || c.includes("web") || c.includes("dominio")) return "website";
  if (c.includes("recomenda") || c.includes("ia") || c.includes("relatorio")) return "ia";
  if (c.includes("reuni") || c.includes("meeting")) return "reuniao";
  if (c.includes("pagamento") || c.includes("fatura") || c.includes("stripe")) return "pagamento";
  return "todos";
};

const ICONS: Record<string, typeof Bell> = {
  lead: Users, campanha: Megaphone, website: Globe, ia: Sparkles,
  reuniao: CalendarDays, pagamento: CreditCard, problema: AlertTriangle, todos: Bell,
};

const toneOf = (severity: string) =>
  severity === "critico" ? "bad" : severity === "atencao" ? "warn" : severity === "oportunidade" ? "good" : "neutral";

const NotificationsModule = ({
  data, onRead, onReadAll, onNavigate,
}: {
  data: HubSnapshot;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onNavigate: (module: string) => void;
}) => {
  const [filter, setFilter] = useState<Filter>("todos");
  const items = data.notifications ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: items.length, nao_lidos: items.filter((n) => !n.read_at).length };
    items.forEach((n) => { const g = groupOf(n); c[g] = (c[g] ?? 0) + 1; });
    return c;
  }, [items]);

  const visible = items.filter((n) =>
    filter === "todos" ? true : filter === "nao_lidos" ? !n.read_at : groupOf(n) === filter,
  );

  const jump = (n: HubNotification) => {
    onRead(n.id);
    const g = groupOf(n);
    const target =
      g === "lead" ? "leads" : g === "campanha" ? "resultados" : g === "website" ? "website"
      : g === "ia" ? "inicio" : g === "reuniao" ? "reunioes" : g === "pagamento" ? "documentos" : null;
    if (target) onNavigate(target);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Alertas"
        hint="Tudo o que acontece no teu negócio, em tempo real"
        action={
          counts.nao_lidos > 0 ? (
            <button onClick={onReadAll} className="os-btn !px-3 text-xs">
              <CheckCheck size={13} /> Marcar tudo como lido
            </button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = counts[f.key] ?? 0;
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="os-btn !px-3 text-xs"
              style={on ? { background: "rgba(124,58,237,.18)", borderColor: "rgba(124,58,237,.4)", color: "#fff" } : undefined}
            >
              {f.label}{n > 0 ? ` · ${n}` : ""}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <Empty title="Sem alertas" hint="Assim que houver novidades no teu negócio, aparecem aqui automaticamente." />
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const g = groupOf(n);
            const Icon = ICONS[g] ?? Bell;
            return (
              <Panel key={n.id} className="p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(124,58,237,.14)" }}>
                  <Icon size={14} style={{ color: "var(--os-accent)" }} />
                </div>
                <button onClick={() => jump(n)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-[13px] ${n.read_at ? "os-dim" : "font-medium"}`}>{n.title}</p>
                    <Pill tone={toneOf(n.severity) as any}>{n.severity}</Pill>
                    {!n.read_at && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--os-accent)" }} />}
                  </div>
                  {n.detail && <p className="text-xs os-faint mt-1">{n.detail}</p>}
                  <p className="text-[11px] os-faint mt-1">{fmtDateTime(n.created_at)}</p>
                </button>
                {!n.read_at && (
                  <button onClick={() => onRead(n.id)} className="os-btn !px-2 shrink-0" title="Marcar como lido">
                    <Check size={13} />
                  </button>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsModule;
