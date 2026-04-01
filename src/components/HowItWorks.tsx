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
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4" style={{ fontWeight: 800 }}>
            Como <em className="text-gradient not-italic">funciona</em>
          </h2>
        </FadeIn>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.3)] to-transparent" />

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.2} className="text-center relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                <span className="text-white font-mono font-bold text-lg">{step.num}</span>
              </div>
              <h3 className="font-display text-2xl text-foreground mb-2" style={{ fontWeight: 700 }}>{step.title}</h3>
              <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
