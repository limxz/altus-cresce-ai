import { FadeIn } from "./FadeIn";
import { useBooking } from "@/contexts/BookingContext";
import { Check, ArrowRight, Target, TrendingUp, MessageCircle } from "lucide-react";

const services = ["Meta Ads", "Landing Page", "WhatsApp Bot", "IA + Automações"];

const metrics = [
  { icon: Target, label: "Leads qualificados", value: "+73" },
  { icon: TrendingUp, label: "ROAS", value: "+189%" },
  { icon: MessageCircle, label: "Tempo de resposta", value: "< 1min" },
];

const CaseGracieBarra = () => {
  const { openBooking } = useBooking();
  return (
    <section id="cases" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Case Studies</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Como transformámos a <em className="text-gradient not-italic">Gracie Barra</em>.
          </h2>
        </FadeIn>

        <FadeIn>
          <div
            className="relative overflow-hidden rounded-[28px] p-8 md:p-12 grid lg:grid-cols-5 gap-10 items-center"
            style={{
              background: "linear-gradient(135deg, rgba(28,24,41,0.7), rgba(22,18,35,0.55))",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(123,47,255,0.15)",
              boxShadow: "0 0 80px rgba(123,47,255,0.08), 0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-accent" style={{ background: "rgba(123,47,255,0.1)", border: "1px solid rgba(123,47,255,0.2)" }}>
                  GB
                </div>
                <div>
                  <h3 className="font-display text-foreground text-xl" style={{ fontWeight: 600 }}>Gracie Barra</h3>
                  <p className="text-muted-foreground text-sm">Escola de Jiu-Jitsu · Portugal</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70 mb-1">Desafio</p>
                  <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                    Aumentar o número de potenciais alunos e automatizar totalmente o atendimento inicial.
                  </p>
                </div>
                <div>
                  <p className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70 mb-1">Solução</p>
                  <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                    Campanhas de Meta Ads, landing page de alta conversão, agente de IA no WhatsApp e follow-ups automáticos.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs text-foreground/85" style={{ background: "rgba(123,47,255,0.08)", border: "1px solid rgba(123,47,255,0.2)" }}>
                    {s}
                  </span>
                ))}
              </div>

              <button onClick={openBooking} className="btn-glass !py-3 !px-6 !text-sm inline-flex items-center gap-2">
                Quero resultados como estes <ArrowRight size={14} />
              </button>
            </div>

            <div className="lg:col-span-2 space-y-3">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: "rgba(9,9,15,0.4)", border: "1px solid rgba(123,47,255,0.12)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
                    <m.icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-gradient font-bold text-2xl tabular-nums" style={{ letterSpacing: "-0.02em", lineHeight: 1 }}>
                      {m.value}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">{m.label}</div>
                  </div>
                  <Check size={16} className="text-accent" />
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default CaseGracieBarra;
