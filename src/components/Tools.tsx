import { FadeIn } from "./FadeIn";

const tools = [
  "Meta", "Instagram", "Facebook", "WhatsApp", "OpenAI",
  "n8n", "Cloudflare", "Stripe", "Supabase",
];

const Tools = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-10">
          <p className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">Ferramentas</p>
          <h3 className="font-display text-foreground text-xl md:text-2xl" style={{ fontWeight: 500, letterSpacing: "-0.02em" }}>
            Trabalhamos com as melhores plataformas do mercado.
          </h3>
        </FadeIn>
        <FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {tools.map((t) => (
              <div
                key={t}
                className="px-5 py-2.5 rounded-full text-muted-foreground/80 font-display text-sm tracking-wide transition-colors duration-200 hover:text-foreground"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(123,47,255,0.1)" }}
              >
                {t}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Tools;
