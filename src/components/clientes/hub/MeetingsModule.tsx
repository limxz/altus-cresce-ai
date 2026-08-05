import { HubSnapshot } from "@/hooks/useClientHub";
import { Panel, SectionTitle, Empty, Pill, fmtDateTime } from "./HubUI";
import { CalendarDays, Video, MapPin, Sparkles } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

const MeetingsModule = ({ data }: { data: HubSnapshot }) => {
  const { openBooking } = useBooking() as any;
  const meetings = data.meetings ?? [];
  const now = Date.now();
  const upcoming = meetings.filter((m: any) => +new Date(m.scheduled_at) >= now && m.status !== "cancelada");
  const past = meetings.filter((m: any) => +new Date(m.scheduled_at) < now || m.status === "cancelada");

  const Card = ({ m }: { m: any }) => (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium">{m.title}</p>
          <p className="text-xs os-dim mt-1 flex items-center gap-1.5">
            <CalendarDays size={11} /> {fmtDateTime(m.scheduled_at)} · {m.duration_minutes} min
          </p>
          {m.location && (
            <p className="text-xs os-faint mt-1 flex items-center gap-1.5">
              {m.location.startsWith("http") ? <Video size={11} /> : <MapPin size={11} />}
              {m.location.startsWith("http")
                ? <a href={m.location} target="_blank" rel="noreferrer" className="underline">Entrar na reunião</a>
                : m.location}
            </p>
          )}
        </div>
        <Pill tone={m.status === "realizada" ? "good" : m.status === "cancelada" ? "bad" : "accent"}>{m.status}</Pill>
      </div>
      {m.ai_summary && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--os-line)" }}>
          <p className="text-xs os-faint flex items-center gap-1.5 mb-1">
            <Sparkles size={11} style={{ color: "var(--os-accent)" }} /> Resumo
          </p>
          <p className="text-xs os-dim leading-relaxed">{m.ai_summary}</p>
        </div>
      )}
      {!m.ai_summary && m.notes && <p className="text-xs os-dim mt-3 leading-relaxed">{m.notes}</p>}
    </Panel>
  );

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle
          title="Próximas reuniões"
          hint="Sessões de estratégia e acompanhamento com a equipa Altus"
          action={
            <button onClick={() => openBooking?.()} className="os-btn">
              <CalendarDays size={13} /> Marcar reunião
            </button>
          }
        />
        {upcoming.length === 0 ? (
          <Panel className="p-2">
            <Empty title="Sem reuniões agendadas" hint="Marca uma sessão com a equipa para rever resultados e definir os próximos passos." />
          </Panel>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">{upcoming.map((m: any) => <Card key={m.id} m={m} />)}</div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <SectionTitle title="Histórico" hint="Reuniões anteriores e respetivos resumos" />
          <div className="grid md:grid-cols-2 gap-3">{past.map((m: any) => <Card key={m.id} m={m} />)}</div>
        </section>
      )}
    </div>
  );
};

export default MeetingsModule;
