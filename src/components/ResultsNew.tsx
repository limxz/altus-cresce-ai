import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { FadeIn } from "./FadeIn";

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
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return { count, ref };
};

const cases = [
  {
    emoji: "🍽️",
    type: "Restaurante",
    before: "2 reservas/semana",
    after: "23 reservas/semana",
    metric: 1050,
    metricLabel: "% em marcações",
    quote: "Bot responde a 100% das mensagens em 2 segundos",
  },
  {
    emoji: "💆",
    type: "Clínica Estética",
    before: "40 seguidores",
    after: "847 seguidores",
    metric: 606,
    metricLabel: "% crescimento em 60 dias",
    quote: "Posts diários sem trabalho da equipa",
  },
  {
    emoji: "🏋️",
    type: "Ginásio",
    before: "6h/semana em marketing",
    after: "0 horas",
    metric: 90,
    metricLabel: "€/semana poupados",
    quote: "Todo o marketing automatizado",
  },
];

const ResultsNew = () => {
  return (
    <section id="resultados" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <h2 className="font-display text-3xl md:text-4xl text-center text-foreground mb-2">
            Resultados reais. Negócios reais. 
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Vê o que a automação com IA fez por negócios como o teu.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {cases.map((c, i) => (
            <CaseCard key={i} {...c} delay={i * 0.15} />
          ))}
        </div>

        {/* Guarantee */}
        <FadeIn>
          <div className="glass-card p-6 md:p-8 border-2 border-green-500/30 bg-green-950/10 text-center">
            <p className="text-green-400 font-display text-lg mb-2">✅ GARANTIA DE RESULTADOS</p>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              Se não trouxermos pelo menos 3 clientes novos no primeiro mês,
              devolvemos o dinheiro. Sem perguntas. Sem letras pequenas.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

const CaseCard = ({ emoji, type, before, after, metric, metricLabel, quote, delay }: any) => {
  const { count, ref } = useCountUp(metric);
  return (
    <FadeIn delay={delay}>
      <div ref={ref} className="glass-card p-6 h-full flex flex-col">
        <div className="text-2xl mb-3">{emoji} {type}</div>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-muted-foreground text-xs line-through">{before}</div>
          <span className="text-primary">→</span>
          <div className="text-foreground text-sm font-medium">{after}</div>
        </div>
        <div className="text-primary font-display text-3xl mb-1">
          +{count}{metricLabel.startsWith("€") ? "" : ""}{metricLabel.startsWith("€") ? `€` : ""}
        </div>
        <p className="text-primary/70 text-xs mb-4">{metricLabel}</p>
        <p className="text-muted-foreground text-xs italic mt-auto">"{quote}"</p>
      </div>
    </FadeIn>
  );
};

export default ResultsNew;
