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
            background: "rgba(28, 24, 41, 0.5)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            border: "1px solid rgba(139,92,246,0.25)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 80px rgba(139,92,246,0.1), 0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          {/* Top edge highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {/* Radial glow behind content */}
          <div
            className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[80%] h-[80%] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)" }}
          />

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
              className="btn-primary !px-12 !py-4 !text-base"
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
