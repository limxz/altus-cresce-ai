import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { FadeIn } from "./FadeIn";
import { Shield } from "lucide-react";

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
    type: "Restaurante",
    category: "Restauração",
    before: "2 reservas/semana",
    after: "23 reservas/semana",
    metric: 1050,
    metricLabel: "% em marcações",
    quote: "Bot responde a 100% das mensagens em 2 segundos",
  },
  {
    type: "Clínica Estética",
    category: "Saúde & Beleza",
    before: "40 seguidores",
    after: "847 seguidores",
    metric: 606,
    metricLabel: "% crescimento em 60 dias",
    quote: "Posts diários sem trabalho da equipa",
  },
  {
    type: "Ginásio",
    category: "Fitness",
    before: "6h/semana em marketing",
    after: "0 horas",
    metric: 90,
    metricLabel: "€/semana poupados",
    quote: "Todo o marketing automatizado",
  },
];

const ResultsNew = () => {
  return (
    <section id="resultados" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn>
          <h2 className="font-display text-center text-foreground mb-3" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Resultados reais. Negócios reais.
          </h2>
          <p className="text-muted-foreground text-center mb-14">
            Vê o que a automação com IA fez por negócios como o teu.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {cases.map((c, i) => (
            <CaseCard key={i} {...c} delay={i * 0.15} />
          ))}
        </div>

        {/* Guarantee */}
        <FadeIn>
          <div className="rounded-[20px] p-8 text-center" style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield size={18} className="text-[hsl(var(--success))]" />
              <p className="text-[hsl(var(--success))] font-display text-lg" style={{ fontWeight: 700 }}>GARANTIA DE RESULTADOS</p>
            </div>
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

const CaseCard = ({ type, category, before, after, metric, metricLabel, quote, delay }: any) => {
  const { count, ref } = useCountUp(metric);
  return (
    <FadeIn delay={delay}>
      <div ref={ref} className="glass-card p-7 h-full flex flex-col">
        <span className="font-mono text-[0.625rem] tracking-[0.12em] uppercase px-3 py-1 rounded-full inline-block w-fit mb-5" style={{ color: "hsl(var(--accent))", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
          {category}
        </span>
        <h3 className="font-display text-lg text-foreground mb-4" style={{ fontWeight: 600 }}>{type}</h3>
        <div className="flex items-center gap-3 mb-5">
          <div className="text-muted-foreground text-xs line-through">{before}</div>
          <span className="text-primary">→</span>
          <div className="text-foreground text-sm font-medium">{after}</div>
        </div>
        <div className="font-mono text-[2.5rem] mb-1 text-accent leading-none" style={{ textShadow: "0 0 20px rgba(167,139,250,0.3)" }}>
          +{count}
        </div>
        <p className="font-mono text-[0.625rem] tracking-[0.12em] uppercase text-muted-foreground mb-5">{metricLabel}</p>
        <p className="text-muted-foreground text-[0.8125rem] italic mt-auto pl-3" style={{ borderLeft: "2px solid rgba(139,92,246,0.3)" }}>"{quote}"</p>
      </div>
    </FadeIn>
  );
};

export default ResultsNew;
