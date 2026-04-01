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
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4" style={{ fontWeight: 800 }}>
            O que <em className="text-gradient not-italic">fazemos</em>
          </h2>
          <p className="text-[#9CA3AF] max-w-xl mx-auto">
            Serviços desenhados para fazer o teu negócio crescer com inteligência artificial.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="p-7 h-full group rounded-[20px] border border-[#2A2040] bg-[#1C1829] transition-all duration-300 hover:border-[rgba(139,92,246,0.4)] hover:shadow-[0_0_32px_rgba(139,92,246,0.1),0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5">
                <div className="w-14 h-14 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center mb-6 group-hover:bg-[rgba(139,92,246,0.2)] transition-colors duration-300">
                  <service.icon className="text-[#8B5CF6]" size={28} />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-3" style={{ fontWeight: 700 }}>
                  {service.title}
                </h3>
                <p className="text-[#9CA3AF] leading-relaxed text-sm">
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
