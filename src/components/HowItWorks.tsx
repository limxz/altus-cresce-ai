import { FadeIn } from "./FadeIn";

const steps = [
  { num: "01", title: "Análise gratuita", desc: "Analisamos o teu negócio e identificamos oportunidades de crescimento." },
  { num: "02", title: "Estratégia com IA", desc: "Criamos uma estratégia personalizada usando inteligência artificial." },
  { num: "03", title: "Tu recebes clientes", desc: "Tu recebes os clientes, nós tratamos de todo o resto." },
];

const HowItWorks = () => {
  return (
    <section id="sobre" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            Como <em className="text-gradient not-italic">funciona</em>
          </h2>
        </FadeIn>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.2} className="text-center relative">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-[0_0_30px_hsl(262_83%_58%/0.3)]">
                <span className="text-primary-foreground font-bold text-lg">{step.num}</span>
              </div>
              <h3 className="font-display text-2xl text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
