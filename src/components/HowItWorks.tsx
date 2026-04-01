import { FadeIn } from "./FadeIn";

const steps = [
  { num: "01", title: "Análise gratuita", desc: "Analisamos o teu negócio e identificamos oportunidades de crescimento." },
  { num: "02", title: "Estratégia com IA", desc: "Criamos uma estratégia personalizada usando inteligência artificial." },
  { num: "03", title: "Tu recebes clientes", desc: "Tu recebes os clientes, nós tratamos de todo o resto." },
];

const HowItWorks = () => {
  return (
    <section id="sobre" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Como <em className="text-gradient not-italic">funciona</em>
          </h2>
        </FadeIn>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[30px] left-[16%] right-[16%] h-px" style={{ background: "linear-gradient(to right, transparent, rgba(123,47,255,0.3), rgba(45,156,255,0.3), transparent)" }} />

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.2} className="text-center relative">
              <div
                className="w-[60px] h-[60px] mx-auto rounded-full flex items-center justify-center mb-6 relative"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
                  boxShadow: "0 0 32px rgba(123,47,255,0.35), 0 0 12px rgba(45,156,255,0.2)",
                }}
              >
                <span className="text-white font-mono font-medium text-base">{step.num}</span>
              </div>
              <h3 className="font-display text-xl text-foreground mb-3" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>{step.title}</h3>
              <p className="text-muted-foreground text-[0.9375rem] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
