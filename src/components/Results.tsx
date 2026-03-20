import { FadeIn } from "./FadeIn";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "João Silva",
    business: "Restaurante",
    quote: "A Altus Media transformou completamente a nossa presença online. Em 2 meses, duplicámos as reservas.",
    metric: "+40% seguidores",
    stars: 5,
  },
  {
    name: "Ana Costa",
    business: "Clínica Estética",
    quote: "Profissionalismo incrível. A IA deles responde aos clientes 24/7 e já não perdemos nenhum lead.",
    metric: "+25% clientes novos",
    stars: 5,
  },
];

const Results = () => {
  return (
    <section id="resultados" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            Resultados <em className="text-gradient not-italic">reais</em>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="glass-card p-8 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={16} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-6 flex-1 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-medium text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.business}</p>
                  </div>
                  <span className="text-sm font-bold text-gradient">{t.metric}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Results;
