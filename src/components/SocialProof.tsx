import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";
import { FadeIn } from "./FadeIn";

const useCountUp = (end: number, duration = 2000, suffix = "") => {
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

  return { count, ref, suffix };
};

const stats = [
  { value: 24, suffix: "+", label: "Negócios locais transformados" },
  { value: 142, suffix: "k€+", label: "Gerados para clientes" },
  { value: 100, suffix: "%", label: "Taxa de satisfação" },
];

const SocialProof = () => {
  return (
    <section id="social-proof" className="py-16 px-6">
      <FadeIn className="max-w-[1200px] mx-auto">
        <div className="glass-card p-8 md:p-12">
          <p className="text-center font-mono text-xs text-[#6B7280] tracking-[0.1em] uppercase mb-10">
            Já ajudámos negócios em Portugal a crescer
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <StatItem key={i} value={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

const StatItem = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <div className="font-mono text-5xl md:text-6xl text-gradient font-medium" style={{ textShadow: "0 0 20px rgba(167,139,250,0.4)" }}>
        {count}
        {suffix}
      </div>
      <p className="text-[#9CA3AF] text-sm mt-2">{label}</p>
    </div>
  );
};

export default SocialProof;
