import { FadeIn } from "./FadeIn";
import { useBooking } from "@/contexts/BookingContext";

const FinalCTA = () => {
  const { openBooking } = useBooking();
  return (
    <section id="contacto" className="py-24 px-6">
      <FadeIn>
        <div
          className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl p-12 md:p-20 text-center"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #7C3AED, #A78BFA)",
          }}
        >
          {/* Glow effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-white/10 blur-[80px] rounded-full" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-6xl text-white mb-4" style={{ fontWeight: 800 }}>
              Pronto para <em className="not-italic">crescer?</em>
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Marca uma chamada gratuita de 20 minutos e descobre como a IA pode transformar o teu negócio.
            </p>
            <button
              onClick={openBooking}
              className="inline-block px-10 py-4 bg-white text-[#7C3AED] rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-200 active:scale-[0.98]"
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
