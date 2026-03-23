import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingUp, Users, MessageCircle } from "lucide-react";
import ParticleCanvas from "./ParticleCanvas";

const HeroNew = () => {
  const [liveCount, setLiveCount] = useState(Math.floor(Math.random() * 7) + 2);

  // Rotate live count every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(Math.floor(Math.random() * 7) + 2);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const line1 = "A tua concorrência já está a usar IA.";
  const line2 = "O teu negócio ainda não.";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <ParticleCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div>
          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-muted border border-primary/40 text-muted-foreground">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              LIVE — {liveCount} negócios em Braga receberam leads hoje
            </span>
          </motion.div>

          {/* Headline with letter-by-letter animation */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-[52px] leading-[1.1] mb-6">
            {line1.split("").map((char, i) => (
              <motion.span
                key={`l1-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.04, duration: 0.1 }}
                className="text-foreground"
              >
                {char}
              </motion.span>
            ))}
            <br />
            {line2.split("").map((char, i) => (
              <motion.span
                key={`l2-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + line1.length * 0.04 + i * 0.04, duration: 0.1 }}
                className="text-gradient"
              >
                {char}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 0.8 }}
            className="text-muted-foreground text-lg md:text-xl max-w-xl mb-8 leading-relaxed"
          >
            Instalamos sistemas de inteligência artificial que respondem clientes,
            criam conteúdo e trazem vendas — enquanto dormes.
            <br />
            <span className="text-foreground/80">
              Primeiro em Braga. Já provado. Garantia de resultados.
            </span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4 }}
            className="flex flex-col sm:flex-row gap-4 mb-8"
          >
            <a href="#calculadora" className="btn-primary text-center">
              Ver quanto estou a perder →
            </a>
            <a
              href="https://cal.com/altusmedia"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-center"
            >
              Falar com a equipa
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.5 }}
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {[
              "Resposta em 0 segundos",
              "Portal do cliente incluído",
              "Resultados em 7 dias",
              "Garantia de devolução",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span> {item}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right side - Dashboard mockup (desktop only) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className="hidden lg:block"
        >
          <div className="glass-card p-6 relative">
            <div className="absolute -inset-1 bg-primary/10 rounded-xl blur-xl -z-10" />
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">
              Dashboard em tempo real
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <MetricCard icon={<Users size={16} />} label="Leads" value={47} suffix="/mês" />
              <MetricCard icon={<TrendingUp size={16} />} label="Seguidores" value={847} />
              <MetricCard icon={<MessageCircle size={16} />} label="Mensagens" value={312} />
            </div>
            {/* Mini chart */}
            <div className="h-32 flex items-end gap-1">
              {[20, 35, 25, 45, 40, 55, 50, 65, 60, 75, 70, 85].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 2.5 + i * 0.1, duration: 0.5 }}
                  className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#calculadora"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-accent transition-colors"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={28} />
        </motion.div>
      </motion.a>
    </section>
  );
};

// Counting metric card
const MetricCard = ({
  icon,
  label,
  value,
  suffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-muted/50 rounded-lg p-3 border border-border">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">
        {count}
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
};

export default HeroNew;
