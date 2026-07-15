import { FadeIn } from "./FadeIn";
import { Megaphone, LayoutTemplate, Sparkles, MessageCircle, Repeat, UserCheck, ArrowRight } from "lucide-react";

const steps = [
  { icon: Megaphone, title: "Anúncios", desc: "Meta Ads e Google Ads segmentados para o teu público certo." },
  { icon: LayoutTemplate, title: "Landing Page", desc: "Página desenhada para converter visitas em contactos qualificados." },
  { icon: Sparkles, title: "IA", desc: "Um agente inteligente qualifica e prioriza cada lead em tempo real." },
  { icon: MessageCircle, title: "WhatsApp", desc: "Resposta imediata 24/7 pelo canal que os teus clientes já usam." },
  { icon: Repeat, title: "Follow-up", desc: "Sequências automáticas que trazem de volta quem não decidiu logo." },
  { icon: UserCheck, title: "Novo Cliente", desc: "Reuniões marcadas e vendas fechadas — sem esforço da tua parte." },
];

const SistemaAltus = () => {
  return (
    <section id="sistema" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Sistema Altus</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Um <em className="text-gradient not-italic">sistema completo</em> de aquisição.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada etapa desenhada para trabalhar em conjunto — do primeiro clique ao cliente fechado.
          </p>
        </FadeIn>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.08}>
              <div className="relative h-full">
                <div
                  className="glass-card h-full p-5 flex flex-col items-start gap-3"
                  style={{ borderRadius: 18 }}
                >
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(123,47,255,0.2), rgba(45,156,255,0.15))", border: "1px solid rgba(123,47,255,0.25)" }}
                  >
                    <s.icon size={18} className="text-accent" />
                  </div>
                  <div className="font-mono text-[0.625rem] tracking-[0.15em] uppercase text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-display text-foreground text-base" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground text-[0.8125rem] leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 rounded-full items-center justify-center" style={{ background: "hsl(var(--background))", border: "1px solid rgba(123,47,255,0.25)" }}>
                    <ArrowRight size={12} className="text-accent" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SistemaAltus;
