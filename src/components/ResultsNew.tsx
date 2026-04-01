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

        {/* Guarantee — Liquid Glass */}
        <FadeIn>
          <div className="relative group">
            <div
              className="absolute -inset-[1px] rounded-[28px] opacity-60 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: "linear-gradient(135deg, rgba(0,245,212,0.3), rgba(123,47,255,0.15), rgba(0,245,212,0.3))",
                filter: "blur(1px)",
              }}
            />
            <div
              className="relative rounded-[28px] p-12 md:p-16 text-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(28,24,41,0.7), rgba(20,30,28,0.6))",
                backdropFilter: "blur(32px) saturate(200%)",
                WebkitBackdropFilter: "blur(32px) saturate(200%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2), 0 12px 48px rgba(0,0,0,0.4), 0 0 80px rgba(0,245,212,0.04)",
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
              <div className="absolute top-0 left-0 w-24 h-24 opacity-20" style={{ background: "radial-gradient(circle at top left, rgba(0,245,212,0.4), transparent 70%)" }} />
              <div className="absolute bottom-0 right-0 w-32 h-32 opacity-15" style={{ background: "radial-gradient(circle at bottom right, rgba(123,47,255,0.3), transparent 70%)" }} />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(0,245,212,0.3)]"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,245,212,0.15), rgba(0,245,212,0.05))",
                      border: "1px solid rgba(0,245,212,0.25)",
                    }}
                  >
                    <Shield size={22} className="text-accent" />
                  </div>
                </div>
                <p className="text-accent font-mono text-[0.6875rem] tracking-[0.16em] uppercase mb-4" style={{ fontWeight: 600 }}>
                  Garantia de Resultados
                </p>
                <h3 className="font-display text-xl md:text-2xl text-foreground mb-4" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
                  Sem risco. Sem letras pequenas.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                  Se não trouxermos pelo menos 3 clientes novos no primeiro mês,
                  devolvemos o dinheiro. Sem perguntas.
                </p>
              </div>
            </div>
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
        <span className="font-mono text-[0.625rem] tracking-[0.12em] uppercase px-3 py-1 rounded-full inline-block w-fit mb-5" style={{ color: "hsl(var(--accent))", background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.2)" }}>
          {category}
        </span>
        <h3 className="font-display text-lg text-foreground mb-4" style={{ fontWeight: 600 }}>{type}</h3>
        <div className="flex items-center gap-3 mb-5">
          <div className="text-muted-foreground text-xs line-through">{before}</div>
          <span className="text-accent">→</span>
          <div className="text-foreground text-sm font-medium">{after}</div>
        </div>
        <div className="font-mono text-[2.5rem] mb-1 text-accent leading-none" style={{ textShadow: "0 0 24px rgba(0,245,212,0.3)" }}>
          +{count}
        </div>
        <p className="font-mono text-[0.625rem] tracking-[0.12em] uppercase text-muted-foreground mb-5">{metricLabel}</p>
        <p className="text-muted-foreground text-[0.8125rem] italic mt-auto pl-3" style={{ borderLeft: "2px solid rgba(0,245,212,0.3)" }}>"{quote}"</p>
      </div>
    </FadeIn>
  );
};

export default ResultsNew;
