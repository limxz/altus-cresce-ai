import { FadeIn } from "./FadeIn";
import { useBooking } from "@/contexts/BookingContext";

const FinalCTA = () => {
  const { openBooking } = useBooking();
  return (
    <section id="contacto" className="py-24 px-6">
      <FadeIn>
        <div className="max-w-4xl mx-auto relative group">
          {/* Animated outer glow border */}
          <div
            className="absolute -inset-[1px] rounded-[32px] opacity-50 group-hover:opacity-80 transition-opacity duration-700"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(167,139,250,0.2), rgba(139,92,246,0.4))",
              filter: "blur(1px)",
            }}
          />
          <div
            className="relative overflow-hidden rounded-[32px] p-16 md:p-20 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(28,24,41,0.7), rgba(22,18,35,0.6))",
              backdropFilter: "blur(40px) saturate(200%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2), 0 0 100px rgba(139,92,246,0.1), 0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top edge highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            {/* Radial glow behind content */}
            <div
              className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[90%] h-[90%] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 65%)" }}
            />
            {/* Corner accents */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-15" style={{ background: "radial-gradient(circle at top right, rgba(167,139,250,0.4), transparent 70%)" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10" style={{ background: "radial-gradient(circle at bottom left, rgba(139,92,246,0.3), transparent 70%)" }} />

            <div className="relative z-10">
              <h2
                className="font-display text-foreground mb-5"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Pronto para <em className="not-italic text-gradient">crescer?</em>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Marca uma chamada gratuita de 20 minutos e descobre como a IA pode
                transformar o teu negócio.
              </p>
              <button
                onClick={openBooking}
                className="btn-primary !px-12 !py-4 !text-base group-hover:shadow-[0_0_32px_rgba(139,92,246,0.4)] transition-shadow duration-500"
              >
                Agendar Chamada Gratuita
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default FinalCTA;
