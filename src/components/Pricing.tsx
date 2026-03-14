import { FadeIn } from "./FadeIn";
import { Check, X } from "lucide-react";
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

const services = [
  { icon: "📱", title: "Gestão de Redes Sociais", description: "Posts criados com IA para Instagram e Facebook", price: "A partir de €150/mês", link: "Saber mais →" },
  { icon: "📢", title: "Facebook & Instagram Ads", description: "Campanhas que chegam aos clientes certos", price: "A partir de €197/mês", link: "Saber mais →" },
  { icon: "🌐", title: "Site Profissional", description: "Site moderno, rápido e otimizado para converter", price: "A partir de €89/mês", link: "Saber mais →" },
  { icon: "🤖", title: "Agente WhatsApp IA", description: "Responde clientes e qualifica leads 24/7", price: "€297 setup + €77/mês", link: "Saber mais →" },
  { icon: "🎙️", title: "Agente de Voz IA", description: "Atende chamadas automaticamente com voz natural", price: "€397 setup + €97/mês", link: "Saber mais →" },
  { icon: "📦", title: "Bundle Personalizado", description: "Combinamos serviços para o teu negócio específico", price: "Preço personalizado", link: "Pedir proposta →" },
];

const Pricing = () => {
  const { openBooking } = useBooking();

  return (
    <section id="precos" className="py-24 px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
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
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "md:scale-105 border-primary/40"
                    : "border-primary/20"
                }`}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${plan.popular ? "rgba(124,58,237,0.4)" : "rgba(124,58,237,0.2)"}`,
                  boxShadow: plan.popular
                    ? "0 0 40px rgba(124,58,237,0.3)"
                    : "none",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-sans font-semibold px-4 py-1.5 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}

                <h3 className="font-display text-2xl text-foreground mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-6">{plan.subtitle}</p>

                <div className="mb-8">
                  <span className="font-display text-5xl text-foreground">{plan.price}</span>
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
                  className={`w-full py-3 rounded-lg font-sans font-semibold text-sm tracking-wide transition-all duration-300 ${
                    plan.filled
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                      : "border border-primary/40 text-foreground hover:bg-primary/10"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Individual Services */}
        <FadeIn className="text-center mb-12">
          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2">
            Ou escolhe apenas o que precisas
          </h3>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {services.map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                className="bg-altus-surface rounded-xl p-6 border-l-[3px] border-l-primary hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] h-full"
              >
                <span className="text-2xl mb-3 block">{s.icon}</span>
                <h4 className="font-display text-lg text-foreground mb-1">{s.title}</h4>
                <p className="text-muted-foreground text-sm mb-3">{s.description}</p>
                <p className="font-display text-foreground text-sm mb-3">{s.price}</p>
                <button onClick={openBooking} className="text-primary text-sm font-sans font-semibold hover:text-accent transition-colors">
                  {s.link}
                </button>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bottom CTA */}
        <FadeIn>
          <div className="glass-card p-8 md:p-12 text-center rounded-2xl">
            <h3 className="font-display text-2xl md:text-3xl text-foreground mb-3">
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
