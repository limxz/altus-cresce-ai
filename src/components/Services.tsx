import { FadeIn } from "./FadeIn";
import { Share2, Target, Bot } from "lucide-react";

const services = [
  {
    icon: Share2,
    title: "Gestão de Redes Sociais",
    description:
      "Conteúdo criado com IA, publicado todos os dias, sem trabalho da tua parte.",
  },
  {
    icon: Target,
    title: "Publicidade Meta & Google",
    description:
      "Anúncios que chegam às pessoas certas, na hora certa.",
  },
  {
    icon: Bot,
    title: "Automações com IA",
    description:
      "Sistemas que respondem clientes, marcam consultas e geram leads 24/7.",
  },
];

const Services = () => {
  return (
    <section id="servicos" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            O que <em className="text-gradient not-italic">fazemos</em>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Serviços desenhados para fazer o teu negócio crescer com inteligência artificial.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="glass-card p-8 h-full group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                  <service.icon className="text-accent" size={28} />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {service.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
