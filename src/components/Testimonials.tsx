import { FadeIn } from "./FadeIn";
import { Star } from "lucide-react";

const testimonials = [
  {
    initials: "MR",
    name: "Marco Ribeiro",
    role: "Proprietário",
    company: "Gracie Barra",
    text: "Em menos de dois meses tínhamos leads todos os dias no WhatsApp. O agente de IA responde melhor do que muita gente que já contratei.",
    rating: 5,
  },
  {
    initials: "AC",
    name: "Ana Costa",
    role: "Directora",
    company: "Clínica Local",
    text: "Finalmente uma agência que fala de resultados, não de likes. Sabemos exactamente onde está cada euro investido.",
    rating: 5,
  },
  {
    initials: "PF",
    name: "Pedro Ferreira",
    role: "CEO",
    company: "PME de serviços",
    text: "Passámos de responder mensagens à noite para receber reuniões agendadas no calendário. Mudou completamente o negócio.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Testemunhos</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            O que os nossos <em className="text-gradient not-italic">clientes</em> dizem.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="glass-card p-7 h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, k) => (
                    <Star key={k} size={14} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground/90 text-[0.9375rem] leading-relaxed flex-1 mb-6">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-semibold text-accent text-sm" style={{ background: "rgba(123,47,255,0.12)", border: "1px solid rgba(123,47,255,0.2)" }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-medium">{t.name}</div>
                    <div className="text-muted-foreground text-xs">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
