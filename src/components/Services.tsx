import { FadeIn } from "./FadeIn";
import { Share2, Target, Bot } from "lucide-react";

const services = [
  {
    icon: Share2,
    title: "Gestão de Redes Sociais",
    description:
      "Conteúdo criado com IA, publicado todos os dias, sem trabalho da tua parte.",
    accent: "123,47,255",
  },
  {
    icon: Target,
    title: "Publicidade Meta & Google",
    description:
      "Anúncios que chegam às pessoas certas, na hora certa.",
    accent: "45,156,255",
  },
  {
    icon: Bot,
    title: "Automações com IA",
    description:
      "Sistemas que respondem clientes, marcam consultas e geram leads 24/7.",
    accent: "0,245,212",
  },
];

const Services = () => {
  return (
    <section id="servicos" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            O que <em className="text-gradient not-italic">fazemos</em>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Serviços desenhados para fazer o teu negócio crescer com inteligência artificial.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div
                className="p-8 h-full group rounded-[20px] transition-all duration-300 relative overflow-hidden"
                style={{
                  background: "rgba(28,24,41,0.5)",
                  backdropFilter: "blur(16px) saturate(160%)",
                  border: "1px solid hsl(var(--border-subtle))",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `rgba(${service.accent},0.4)`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 0 40px rgba(${service.accent},0.1), 0 16px 40px rgba(0,0,0,0.3)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border-subtle))";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-20 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, rgba(${service.accent},0.5), transparent 70%)` }} />

                <div
                  className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-6 transition-all duration-300"
                  style={{
                    background: `rgba(${service.accent},0.1)`,
                    border: `1px solid rgba(${service.accent},0.2)`,
                  }}
                >
                  <service.icon className="text-accent" size={24} />
                </div>
                <h3 className="font-display text-xl text-foreground mb-3" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-[0.9375rem]">
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
