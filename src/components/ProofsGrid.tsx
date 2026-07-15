import { FadeIn } from "./FadeIn";
import { Image as ImageIcon, MessageCircle, LineChart, Video, LayoutDashboard, MessageSquareQuote } from "lucide-react";

const proofs = [
  { icon: ImageIcon, tag: "Meta Ads", title: "Campanha com CPA de 3,80€", desc: "Anúncio para escola local com CTR acima de 4%.", span: "md:col-span-2 md:row-span-1" },
  { icon: MessageCircle, tag: "WhatsApp", title: "Conversa qualificada em 40s", desc: "Agente de IA marcou aula experimental automaticamente.", span: "" },
  { icon: LineChart, tag: "GA4", title: "+189% conversões", desc: "Comparação antes / depois em 60 dias.", span: "" },
  { icon: LayoutDashboard, tag: "Landing", title: "Página com 22% de conversão", desc: "Substituiu website antigo que convertia a 1,8%.", span: "md:col-span-2 md:row-span-1" },
  { icon: MessageSquareQuote, tag: "Cliente", title: "\"Marcámos 14 reuniões esta semana.\"", desc: "Mensagem real recebida no WhatsApp.", span: "" },
  { icon: Video, tag: "Vídeo", title: "Testemunho em vídeo", desc: "Cliente conta o antes e depois em 90 segundos.", span: "md:col-span-2" },
];

const ProofsGrid = () => {
  return (
    <section id="provas" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Provas Reais</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Não pedimos <em className="text-gradient not-italic">confiança</em> — mostramos.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Screenshots, conversas e dashboards reais de campanhas em curso.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[200px] gap-4">
          {proofs.map((p, i) => (
            <FadeIn key={p.title} delay={i * 0.06} className={p.span}>
              <div className="glass-card h-full p-6 flex flex-col justify-between overflow-hidden relative group">
                <div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{ background: "radial-gradient(circle at top right, rgba(123,47,255,0.15), transparent 60%)" }}
                />
                <div className="relative flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(123,47,255,0.2), rgba(45,156,255,0.15))", border: "1px solid rgba(123,47,255,0.25)" }}>
                    <p.icon size={16} className="text-accent" />
                  </div>
                  <span className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70">{p.tag}</span>
                </div>
                <div className="relative">
                  <h3 className="font-display text-foreground text-base mb-1.5" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>{p.title}</h3>
                  <p className="text-muted-foreground text-[0.8125rem] leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProofsGrid;
