import { FadeIn } from "./FadeIn";
import { useBooking } from "@/contexts/BookingContext";

const FinalCTA = () => {
  const { openBooking } = useBooking();
  return (
    <section id="contacto" className="py-24 px-6">
      <FadeIn>
        <div
          className="max-w-4xl mx-auto relative overflow-hidden rounded-[28px] p-16 md:p-20 text-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--surface-card)) 0%, hsl(var(--surface-elevated)) 50%, #2D1A4A 100%)",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 80px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Glow */}
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[70%] h-[70%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)" }} />

          <div className="relative z-10">
            <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Pronto para <em className="not-italic">crescer?</em>
            </h2>
            <p className="text-foreground/70 text-lg mb-10 max-w-xl mx-auto">
              Marca uma chamada gratuita de 20 minutos e descobre como a IA pode transformar o teu negócio.
            </p>
            <button
              onClick={openBooking}
              className="inline-block px-12 py-4 bg-white text-secondary rounded-full font-bold text-base transition-all duration-300 active:scale-[0.98]"
              style={{ boxShadow: "0 0 30px rgba(255,255,255,0.2)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 0 50px rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(255,255,255,0.2)";
              }}
            >
              Agendar Chamada Gratuita
            </button>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default FinalCTA;
