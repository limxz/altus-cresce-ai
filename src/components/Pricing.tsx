import { FadeIn } from "./FadeIn";
import { Check, X, Share2, Megaphone, Globe, Bot, Mic, Package } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";

const plans = [
  {
    name: "Starter",
    price: "€197",
    subtitle: "Para começar a crescer",
    popular: false,
    features: [
      { text: "Gestão Instagram + Facebook", included: true },
      { text: "12 posts por mês criados com IA", included: true },
      { text: "Legendas e hashtags otimizadas", included: true },
      { text: "Relatório mensal de resultados", included: true },
      { text: "Suporte por WhatsApp", included: true },
      { text: "Facebook & Instagram Ads", included: false },
      { text: "Agente WhatsApp IA", included: false },
      { text: "Site profissional", included: false },
    ],
    cta: "Começar Agora",
    filled: false,
  },
  {
    name: "Growth",
    price: "€297",
    subtitle: "Para negócios que querem escalar",
    popular: true,
    features: [
      { text: "Tudo do Starter", included: true },
      { text: "20 posts por mês + Stories diários", included: true },
      { text: "Facebook & Instagram Ads (budget até €500)", included: true },
      { text: "Relatório semanal com métricas", included: true },
      { text: "Agente WhatsApp IA Basic", included: true },
      { text: "Suporte prioritário 24/7", included: true },
      { text: "Site profissional", included: false },
      { text: "Agente de Voz IA", included: false },
    ],
    cta: "Começar Agora",
    filled: true,
  },
  {
    name: "Pro",
    price: "€419",
    subtitle: "Solução completa com IA",
    popular: false,
    features: [
      { text: "Tudo do Growth", included: true },
      { text: "Posts diários + Reels + Stories", included: true },
      { text: "Ads ilimitados + Retargeting + Funil completo", included: true },
      { text: "Agente WhatsApp IA Pro (qualifica leads 24/7)", included: true },
      { text: "Agente de Voz IA (atende chamadas automaticamente)", included: true },
      { text: "Site profissional incluído (valor €897)", included: true },
      { text: "Reunião estratégica mensal", included: true },
      { text: "Account manager dedicado", included: true },
    ],
    cta: "Falar com a Equipa",
    filled: false,
  },
];

const serviceIcons = [Share2, Megaphone, Globe, Bot, Mic, Package];

const services = [
  { icon: Share2, title: "Gestão de Redes Sociais", description: "Posts criados com IA para Instagram e Facebook", price: "A partir de €150/mês", link: "Saber mais" },
  { icon: Megaphone, title: "Facebook & Instagram Ads", description: "Campanhas que chegam aos clientes certos", price: "A partir de €197/mês", link: "Saber mais" },
  { icon: Globe, title: "Site Profissional", description: "Site moderno, rápido e otimizado para converter", price: "A partir de €89/mês", link: "Saber mais" },
  { icon: Bot, title: "Agente WhatsApp IA", description: "Responde clientes e qualifica leads 24/7", price: "€297 setup + €77/mês", link: "Saber mais" },
  { icon: Mic, title: "Agente de Voz IA", description: "Atende chamadas automaticamente com voz natural", price: "€397 setup + €97/mês", link: "Saber mais" },
  { icon: Package, title: "Bundle Personalizado", description: "Combinamos serviços para o teu negócio específico", price: "Preço personalizado", link: "Pedir proposta" },
];

const Pricing = () => {
  const { openBooking } = useBooking();

  return (
    <section id="precos" className="py-24 px-6 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[120px]" style={{ background: "rgba(139,92,246,0.05)" }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Planos & <em className="text-gradient not-italic">Preços</em>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolhe o plano certo para o teu negócio
          </p>
        </FadeIn>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-24">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.15}>
              <div
                className={`relative rounded-[20px] p-8 transition-all duration-300 hover:-translate-y-1 ${plan.popular ? "md:scale-105" : ""}`}
                style={{
                  background: "rgba(28,24,41,0.6)",
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${plan.popular ? "rgba(139,92,246,0.4)" : "rgba(42,32,64,0.9)"}`,
                  boxShadow: plan.popular ? "0 0 40px rgba(139,92,246,0.15)" : "none",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="font-mono text-[0.625rem] tracking-[0.1em] uppercase px-4 py-1.5 rounded-full text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
                      Mais Popular
                    </span>
                  </div>
                )}

                <h3 className="font-display text-xl text-foreground mb-1" style={{ fontWeight: 600 }}>{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.subtitle}</p>

                <div className="mb-8">
                  <span className="font-display text-5xl text-foreground" style={{ fontWeight: 800 }}>{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-start gap-3 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/40"}`}>
                      {f.included ? (
                        <Check size={16} className="text-primary mt-0.5 shrink-0" />
                      ) : (
                        <X size={16} className="mt-0.5 shrink-0" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={openBooking}
                  className={`w-full py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                    plan.filled
                      ? "text-white"
                      : "text-foreground hover:bg-primary/10"
                  }`}
                  style={plan.filled
                    ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }
                    : { border: "1px solid rgba(139,92,246,0.4)" }
                  }
                >
                  {plan.cta}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Individual Services */}
        <FadeIn className="text-center mb-12">
          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2" style={{ fontWeight: 600 }}>
            Ou escolhe apenas o que precisas
          </h3>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {services.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                className="rounded-[16px] p-6 h-full transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "hsl(var(--surface))",
                  borderLeft: "3px solid hsl(var(--primary))",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(139,92,246,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(139,92,246,0.1)" }}>
                  <s.icon size={18} className="text-primary" />
                </div>
                <h4 className="font-display text-foreground mb-1" style={{ fontWeight: 600 }}>{s.title}</h4>
                <p className="text-muted-foreground text-sm mb-3">{s.description}</p>
                <p className="text-foreground text-sm font-medium mb-3">{s.price}</p>
                <button onClick={openBooking} className="text-accent text-sm font-semibold hover:text-primary transition-colors">
                  {s.link}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bottom CTA */}
        <FadeIn>
          <div className="glass-card p-8 md:p-12 text-center rounded-[20px]">
            <h3 className="font-display text-2xl md:text-3xl text-foreground mb-3" style={{ fontWeight: 600 }}>
              Não tens a certeza qual o plano certo para ti?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Fala connosco — fazemos uma análise gratuita do teu negócio e recomendamos a melhor solução.
            </p>
            <button
              onClick={openBooking}
              className="btn-primary px-8 py-3 text-base"
            >
              Análise Gratuita
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Pricing;
