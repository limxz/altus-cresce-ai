import { HubSnapshot } from "@/hooks/useClientHub";
import { Panel, SectionTitle, Empty, Pill, fmtDateTime, KpiCard } from "./HubUI";
import { MessageSquare, Flame, UserCheck, Clock } from "lucide-react";
import { useState } from "react";

const statusTone = (s?: string | null) =>
  s === "convertido" || s === "ganho" ? "good" : s === "perdido" ? "bad" : s === "quente" ? "warn" : "accent";

const LeadsModule = ({ data }: { data: HubSnapshot }) => {
  const [filter, setFilter] = useState("todos");
  const leads = data.leads ?? [];

  const hot = leads.filter((l: any) => l.urgency === "alta" || l.lead_status === "quente").length;
  const answered = leads.filter((l: any) => l.status === "respondida" || l.status === "closed").length;

  const visible = leads.filter((l: any) => {
    if (filter === "todos") return true;
    if (filter === "quentes") return l.urgency === "alta" || l.lead_status === "quente";
    if (filter === "novos") return l.status === "aberta" || l.status === "open" || !l.status;
    return true;
  });

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Leads (7 dias)" value={data.kpis.leads.value} delta={data.kpis.leads.delta} icon={MessageSquare} />
        <KpiCard label="Leads quentes" value={hot} icon={Flame} hint="Urgência alta detetada pela IA" />
        <KpiCard label="Já respondidos" value={answered} icon={UserCheck} />
        <KpiCard label="Total registado" value={leads.length} icon={Clock} />
      </section>

      <section>
        <SectionTitle
          title="Conversas recebidas"
          hint="Cada contacto real que chegou através dos teus canais"
          action={
            <div className="flex gap-1.5">
              {["todos", "quentes", "novos"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="os-btn !px-2.5 text-xs"
                  style={filter === f ? { borderColor: "var(--os-accent)", color: "#fff" } : undefined}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          }
        />
        <Panel>
          {visible.length === 0 ? (
            <Empty title="Ainda sem leads" hint="Assim que alguém contactar o teu negócio, a conversa aparece aqui automaticamente." />
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--os-line)" }}>
              {visible.map((l: any) => (
                <div key={l.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium shrink-0"
                    style={{ background: "rgba(124,58,237,.15)", color: "#c4b5fd" }}>
                    {(l.contact_name ?? l.contact_phone ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium truncate">{l.contact_name || l.contact_phone || "Contacto"}</p>
                      {l.lead_status && <Pill tone={statusTone(l.lead_status) as any}>{l.lead_status}</Pill>}
                      {l.urgency === "alta" && <Pill tone="bad">urgente</Pill>}
                    </div>
                    {l.primary_need && <p className="text-xs os-dim mt-1">{l.primary_need}</p>}
                    {l.last_message && <p className="text-xs os-faint mt-1 line-clamp-2">“{l.last_message}”</p>}
                    <p className="text-xs os-faint mt-1">{fmtDateTime(l.last_message_at ?? l.started_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
};

export default LeadsModule;
