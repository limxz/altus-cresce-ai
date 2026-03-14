import { FadeIn } from "./FadeIn";
import { useBooking } from "@/contexts/BookingContext";

const FinalCTA = () => {
  const { openBooking } = useBooking();
  return (
    <section id="contacto" className="py-24 px-6">
      <FadeIn>
        <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl p-12 md:p-20 text-center"
          style={{
            background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(271 91% 65%), hsl(270 95% 75%))",
          }}
        >
          {/* Glow effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-primary-foreground/10 blur-[80px] rounded-full" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-6xl text-primary-foreground mb-4">
              Pronto para <em className="not-italic">crescer?</em>
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Marca uma chamada gratuita de 20 minutos e descobre como a IA pode transformar o teu negócio.
            </p>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-10 py-4 bg-primary-foreground text-primary rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 active:scale-95"
            >
              Agendar Chamada Gratuita
            </a>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default FinalCTA;
