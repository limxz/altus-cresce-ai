import { FadeIn } from "./FadeIn";
import { ShieldCheck, Sparkles, LineChart, Zap, MapPin, Target } from "lucide-react";

const reasons = [
  { icon: ShieldCheck, title: "Sem contratos longos", desc: "Ficas connosco porque queres. Cancela a qualquer momento." },
  { icon: Sparkles, title: "IA integrada de raiz", desc: "Automações e agentes inteligentes em todos os projectos." },
  { icon: LineChart, title: "Relatórios transparentes", desc: "Acesso 24/7 aos teus resultados no portal de cliente." },
  { icon: Zap, title: "Suporte rápido", desc: "Falas connosco pelo WhatsApp e resposta em minutos." },
  { icon: MapPin, title: "Especialistas em negócios locais", desc: "Só trabalhamos com PME em Portugal. Sabemos o que resulta." },
  { icon: Target, title: "Foco total em ROI", desc: "Se não pagares o investimento em vendas, não estamos a fazer o nosso trabalho." },
];

const WhyAltus = () => {
  return (
    <section id="porque" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Porquê Altus</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Uma agência feita para <em className="text-gradient not-italic">gerar clientes</em>.
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reasons.map((r, i) => (
            <FadeIn key={r.title} delay={i * 0.06}>
              <div className="glass-card p-6 h-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, rgba(123,47,255,0.2), rgba(45,156,255,0.15))", border: "1px solid rgba(123,47,255,0.25)" }}>
                  <r.icon size={18} className="text-accent" />
                </div>
                <h3 className="font-display text-foreground text-lg mb-2" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>{r.title}</h3>
                <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">{r.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyAltus;
