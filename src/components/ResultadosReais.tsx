import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { FadeIn } from "./FadeIn";

const useCountUp = (end: number, duration = 2000) => {
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

const stats = [
  { value: 24, suffix: "+", label: "Negócios transformados" },
  { value: 142, suffix: "k€+", label: "Receita gerada para clientes" },
  { value: 100, suffix: "%", label: "Satisfação dos clientes" },
];

// Placeholder logos — substituir pelo CMS na Fase 3
const clientLogos = [
  { name: "Gracie Barra", label: "Gracie Barra" },
  { name: "Cliente", label: "Cliente" },
  { name: "Cliente", label: "Cliente" },
  { name: "Cliente", label: "Cliente" },
  { name: "Cliente", label: "Cliente" },
];

const StatItem = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div
        className="font-display text-gradient font-bold tabular-nums"
        style={{ fontSize: "clamp(3rem, 5.5vw, 4.5rem)", letterSpacing: "-0.04em", textShadow: "0 0 30px rgba(123,47,255,0.3)", lineHeight: 1 }}
      >
        {count}
        {suffix}
      </div>
      <p className="text-muted-foreground text-sm mt-3">{label}</p>
    </div>
  );
};

const ResultadosReais = () => {
  return (
    <section id="resultados" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Resultados Reais</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Empresas que confiaram na <em className="text-gradient not-italic">Altus Media</em>.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Métricas reais de campanhas, automações e sistemas de aquisição de clientes.
          </p>
        </FadeIn>

        <FadeIn>
          <div
            className="rounded-[24px] p-10 md:p-14 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(28,24,41,0.6), rgba(22,18,35,0.5))",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(123,47,255,0.15)",
              boxShadow: "0 0 60px rgba(123,47,255,0.06), 0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4">
              {stats.map((s) => <StatItem key={s.label} {...s} />)}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-12">
            <p className="text-center text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/60 mb-6">
              Clientes que trabalham connosco
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80">
              {clientLogos.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center h-10 px-6 rounded-md text-muted-foreground/70 font-display text-lg tracking-wide"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(123,47,255,0.08)",
                  }}
                >
                  {l.label}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default ResultadosReais;
