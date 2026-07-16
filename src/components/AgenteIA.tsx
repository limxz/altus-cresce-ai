import { FadeIn } from "./FadeIn";
import { Check } from "lucide-react";
import WhatsAppDemo from "./WhatsAppDemo";

const bullets = [
  "Responde automaticamente 24 horas por dia",
  "Marca reuniões directamente no calendário",
  "Qualifica cada lead antes de te chegar",
  "Fala o tom da tua marca em português",
];

const AgenteIA = () => {
  return (
    <section id="agente-ia" className="pt-24 pb-4 px-6">
      <div className="max-w-[1100px] mx-auto">
        <FadeIn className="text-center mb-6">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Agente IA</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Experimenta o que os teus <em className="text-gradient not-italic">clientes</em> vão usar.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Fala com o mesmo tipo de agente que instalamos nos negócios dos nossos clientes.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <Check size={14} className="text-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
      <WhatsAppDemo />
    </section>
  );
};

export default AgenteIA;
