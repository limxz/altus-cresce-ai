import { FadeIn } from "./FadeIn";

const steps = [
  { num: "01", title: "Analisamos o teu negócio", desc: "Auditoria completa ao teu funil, concorrência e oportunidades." },
  { num: "02", title: "Criamos o sistema", desc: "Landing page, campanhas, agente de IA e automações à medida." },
  { num: "03", title: "Lançamos campanhas", desc: "Meta Ads e Google Ads no ar em poucos dias, prontos a gerar leads." },
  { num: "04", title: "Otimizamos continuamente", desc: "Testamos, ajustamos e escalamos o que funciona todas as semanas." },
];

const HowItWorks = () => {
  return (
    <section id="sobre" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Como funciona</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Quatro passos até <em className="text-gradient not-italic">gerares clientes</em>.
          </h2>
        </FadeIn>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="hidden md:block absolute top-[30px] left-[12%] right-[12%] h-px" style={{ background: "linear-gradient(to right, transparent, rgba(123,47,255,0.35), rgba(45,156,255,0.35), rgba(0,245,212,0.3), transparent)" }} />

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.15} className="text-center relative">
              <div
                className="w-[60px] h-[60px] mx-auto rounded-full flex items-center justify-center mb-6 relative"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                  boxShadow: "0 0 32px rgba(123,47,255,0.35), 0 0 12px rgba(45,156,255,0.2)",
                }}
              >
                <span className="text-white font-mono font-medium text-base">{step.num}</span>
              </div>
              <h3 className="font-display text-lg text-foreground mb-3" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>{step.title}</h3>
              <p className="text-muted-foreground text-[0.875rem] leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
