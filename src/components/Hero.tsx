import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

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

const Hero = () => {
  const { openBooking } = useBooking();
  const words = "O teu negócio merece crescer.".split(" ");
  const { count: msgCount, ref: msgRef } = useCountUp(2400, 2000);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[72px]">
      {/* Floating orbs — updated to brand colors */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full" style={{ background: "radial-gradient(circle, rgba(123,47,255,0.2) 0%, transparent 70%)", filter: "blur(80px)", animation: "floatA 12s ease-in-out infinite" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full" style={{ background: "radial-gradient(circle, rgba(45,156,255,0.12) 0%, transparent 70%)", filter: "blur(100px)", animation: "floatB 16s ease-in-out infinite" }} />
        <div className="absolute top-[40%] left-[40%] w-[35%] h-[35%] rounded-full" style={{ background: "radial-gradient(circle, rgba(0,245,212,0.06) 0%, transparent 70%)", filter: "blur(100px)", animation: "floatA 20s ease-in-out infinite reverse" }} />
      </div>

      <div className="relative z-10 text-center max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="badge-pill">
            <Sparkles size={12} className="text-accent" />
            Agência de Marketing com IA
          </span>
        </motion.div>

        <h1 className="font-display text-foreground leading-[1.0] mb-10" style={{ fontSize: "clamp(3.5rem, 7vw, 6rem)", fontWeight: 700, letterSpacing: "-0.04em" }}>
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3 + i * 0.08,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block mr-[0.2em]"
            >
              {word === "crescer." ? (
                <em className="text-gradient not-italic">{word}</em>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg md:text-xl text-muted-foreground max-w-[560px] mx-auto mb-12 leading-relaxed"
        >
          Usamos inteligência artificial para trazer mais clientes ao teu
          negócio —{" "}
          <span className="italic text-foreground/90">
            sem esforço da tua parte.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button onClick={openBooking} className="btn-primary glow-pulse">
            Fala Connosco
          </button>
          <a href="#servicos" className="btn-glass">
            Ver Serviços
          </a>
        </motion.div>

        {/* Contador animado */}
        <motion.div
          ref={msgRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ boxShadow: "0 0 8px rgba(0,245,212,0.6)" }} />
          <span className="text-sm text-muted-foreground">
            Já respondemos a{" "}
            <span className="text-foreground font-semibold tabular-nums">+{msgCount.toLocaleString("pt-PT")}</span>
            {" "}mensagens para negócios em Portugal
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#social-proof"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-accent transition-colors duration-200"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={28} />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default Hero;
