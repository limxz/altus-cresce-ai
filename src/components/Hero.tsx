import { motion } from "framer-motion";
import { ChevronDown, Sparkles, Check } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

const proofs = [
  "+24 negócios locais ajudados",
  "+142 000€ gerados para clientes",
  "+2400 mensagens respondidas automaticamente",
];

const Hero = () => {
  const { openBooking } = useBooking();
  const words = "Geramos clientes para negócios locais.".split(" ");

  const scrollToAgent = () => {
    document.getElementById("agente-ia")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[72px]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full" style={{ background: "radial-gradient(circle, rgba(123,47,255,0.2) 0%, transparent 70%)", filter: "blur(80px)", animation: "floatA 12s ease-in-out infinite" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,156,255,0.12) 0%, transparent 70%)", filter: "blur(100px)", animation: "floatB 16s ease-in-out infinite" }} />
        <div className="absolute top-[40%] left-[40%] w-[35%] h-[35%] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,245,212,0.06) 0%, transparent 70%)", filter: "blur(100px)", animation: "floatA 20s ease-in-out infinite reverse" }} />
      </div>

      <div className="relative z-10 text-center max-w-5xl px-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <span className="badge-pill">
            <Sparkles size={12} className="text-accent" />
            Agência de Marketing com IA · Portugal
          </span>
        </motion.div>

        <h1 className="font-display text-foreground leading-[1.05] mb-8" style={{ fontSize: "clamp(2.75rem, 6.2vw, 5.5rem)", fontWeight: 700, letterSpacing: "-0.04em" }}>
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block mr-[0.22em]"
            >
              {word === "clientes" ? <em className="text-gradient not-italic">{word}</em> : word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-[640px] mx-auto mb-4 leading-relaxed"
        >
          Meta Ads e Inteligência Artificial ao serviço do teu negócio.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-base md:text-[1.0625rem] text-muted-foreground/85 max-w-[680px] mx-auto mb-11 leading-relaxed"
        >
          Criamos campanhas de publicidade, websites de alta conversão e sistemas automáticos que respondem aos teus clientes, qualificam leads e aumentam as vendas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button onClick={openBooking} className="btn-primary glow-pulse">
            Pedir Auditoria Gratuita
          </button>
          <button onClick={scrollToAgent} className="btn-glass">
            Experimentar o Agente IA
          </button>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.25, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground"
        >
          {proofs.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Check size={14} className="text-accent" />
              <span>{p}</span>
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.a
        href="#resultados"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-accent transition-colors duration-200"
        aria-label="Scroll para resultados"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown size={28} />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default Hero;
