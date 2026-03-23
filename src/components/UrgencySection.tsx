import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { FadeIn } from "./FadeIn";
import { X, Check } from "lucide-react";

const useCountUp = (end: number, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return { count, ref };
};

const stats = [
  { value: 32, text: "de 50 restaurantes em Braga não responderam em 4 horas" },
  { value: 41, text: "não têm bot de WhatsApp" },
  { value: 38, text: "nunca publicam nas redes sociais" },
  { value: 3, text: "já usam IA — e estão a crescer 3x mais rápido" },
];

const problemsSemIA = [
  "Perdem clientes fora do horário",
  "Respostas demoram horas ou dias",
  "Posts esporádicos sem estratégia",
  "Sem follow-up automático",
  "Leads perdidos para sempre",
  "Gastam horas em tarefas repetitivas",
];

const solutionsComAltus = [
  "Bot responde 24/7 em segundos",
  "Resposta instantânea e personalizada",
  "Conteúdo diário criado por IA",
  "Follow-up automático e inteligente",
  "Leads qualificados e organizados",
  "Automação total do marketing",
];

const UrgencySection = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <h2 className="font-display text-3xl md:text-4xl text-center text-foreground mb-4">
            Os teus concorrentes em Braga já respondem em segundos?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Estes números são reais. O mercado já está a mudar.
          </p>
        </FadeIn>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <StatCard key={i} value={stat.value} text={stat.text} highlight={i === 3} />
          ))}
        </div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <FadeIn delay={0.1}>
            <div className="glass-card p-6 border-l-4 border-l-red-500">
              <h3 className="font-display text-lg text-foreground mb-4">
                Grupo A — Sem IA
              </h3>
              <ul className="space-y-3">
                {problemsSemIA.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <X size={16} className="text-red-400 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="glass-card p-6 border-l-4 border-l-green-500">
              <h3 className="font-display text-lg text-foreground mb-4">
                Grupo B — Com Altus Media
              </h3>
              <ul className="space-y-3">
                {solutionsComAltus.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check size={16} className="text-green-400 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>

        <FadeIn>
          <div className="text-center">
            <a
              href="#calculadora"
              className="btn-primary inline-block !px-8 !py-3"
            >
              Quero estar no Grupo B →
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

const StatCard = ({ value, text, highlight }: { value: number; text: string; highlight?: boolean }) => {
  const { count, ref } = useCountUp(value);
  return (
    <FadeIn>
      <div ref={ref} className={`glass-card p-6 text-center ${highlight ? "border-green-500/30" : ""}`}>
        <div className={`font-display text-4xl md:text-5xl mb-2 ${highlight ? "text-green-400" : "text-primary"}`}>
          {count}
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
      </div>
    </FadeIn>
  );
};

export default UrgencySection;
