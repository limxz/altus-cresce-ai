import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

const Hero = () => {
  const { openBooking } = useBooking();
  const words = "O teu negócio merece crescer.".split(" ");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Floating orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[100px] rounded-full animate-float-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-secondary/10 blur-[80px] rounded-full animate-glow-pulse" />
      </div>

      <div className="relative z-10 text-center max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6">
          
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase border border-primary/20 text-accent bg-primary/5">
            Agência de Marketing com IA 
          </span>
        </motion.div>

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-foreground leading-[1.05] mb-8">
          {words.map((word, i) =>
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3 + i * 0.12,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="inline-block mr-[0.25em]">
            
              {word === "crescer." ?
            <em className="text-gradient not-italic">{word}</em> :

            word
            }
            </motion.span>
          )}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-lg md:text-xl text-muted-foreground font-sans max-w-2xl mx-auto mb-12 leading-relaxed">
          
          Usamos inteligência artificial para trazer mais clientes ao teu
          negócio —{" "}
          <span className="italic text-foreground/90">
            sem esforço da tua parte.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center">
          
          <button onClick={openBooking} className="btn-primary">
            Fala Connosco
          </button>
          <a href="#servicos" className="btn-outline">
            Ver Serviços
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#social-proof"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-accent transition-colors">
        
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}>
          
          <ChevronDown size={28} />
        </motion.div>
      </motion.a>
    </section>);

};

export default Hero;