import { FadeIn } from "./FadeIn";
import { useBooking } from "@/contexts/BookingContext";
import { ArrowRight, Users, UserPlus, Wallet, TrendingUp } from "lucide-react";
import gracieLogo from "@/assets/gracie-barra-viana.png.asset.json";

const services = ["Instagram Orgânico", "Meta Ads", "Landing Page", "WhatsApp + IA"];

const bigStats = [
  { icon: Users, value: "+407", label: "Novos seguidores no Instagram", sub: "Em apenas 16 dias · começámos do zero (1 julho)" },
  { icon: UserPlus, value: "32", label: "Pré-inscrições geradas", sub: "Em 9 dias · desde 7 de julho" },
  { icon: Wallet, value: "2,50€", label: "Custo por inscrição", sub: "Média do mercado: ~60€ · 24× mais eficiente" },
  { icon: TrendingUp, value: "24×", label: "ROAS projetado", sub: "80€ investidos · retorno recorrente estimado" },
];

const CaseGracieBarra = () => {
  const { openBooking } = useBooking();
  return (
    <section id="cases" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[0.6875rem] font-mono tracking-[0.15em] uppercase text-accent mb-4">Case Study · Em curso</p>
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Como enchemos uma academia <em className="text-gradient not-italic">antes de abrir</em>.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Gracie Barra Viana do Castelo · Instagram criado a 1 de julho · Resultados em 16 dias.
          </p>
        </FadeIn>

        <FadeIn>
          <div
            className="relative overflow-hidden rounded-[28px] p-8 md:p-12"
            style={{
              background: "linear-gradient(135deg, rgba(28,24,41,0.7), rgba(22,18,35,0.55))",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(123,47,255,0.15)",
              boxShadow: "0 0 80px rgba(123,47,255,0.08), 0 8px 40px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header com logo real */}
            <div className="flex items-center gap-4 mb-10 pb-8" style={{ borderBottom: "1px solid rgba(123,47,255,0.12)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <img src={gracieLogo.url} alt="Gracie Barra Viana do Castelo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-foreground text-xl md:text-2xl" style={{ fontWeight: 600 }}>Gracie Barra Viana do Castelo</h3>
                <p className="text-muted-foreground text-sm">Escola de Jiu-Jitsu · Abertura de nova unidade</p>
              </div>
              <div className="hidden md:flex flex-wrap justify-end gap-1.5 max-w-xs">
                {services.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-full text-[0.6875rem] text-foreground/85" style={{ background: "rgba(123,47,255,0.08)", border: "1px solid rgba(123,47,255,0.2)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* GRID DE STATS GRANDES */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {bigStats.map((s) => (
                <div
                  key={s.label}
                  className="relative p-6 rounded-2xl group hover:scale-[1.02] transition-transform"
                  style={{
                    background: "linear-gradient(160deg, rgba(9,9,15,0.6), rgba(9,9,15,0.3))",
                    border: "1px solid rgba(123,47,255,0.15)",
                  }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
                    <s.icon size={16} className="text-white" />
                  </div>
                  <div className="font-display text-gradient font-bold tabular-nums mb-2" style={{ fontSize: "clamp(2rem, 3.5vw, 2.75rem)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div className="text-foreground/90 text-sm font-medium mb-1">{s.label}</div>
                  <div className="text-muted-foreground text-xs leading-relaxed">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Desafio + Solução em duas colunas */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70 mb-2">Desafio</p>
                <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                  Lançar do zero uma nova academia em Viana do Castelo: criar presença digital, gerar pré-inscrições antes da abertura e automatizar todo o atendimento.
                </p>
              </div>
              <div>
                <p className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70 mb-2">Solução</p>
                <p className="text-muted-foreground text-[0.9375rem] leading-relaxed">
                  Instagram criado a 1 de julho, estratégia de conteúdo orgânico, campanhas Meta Ads a partir de 7 de julho, landing page de pré-inscrição e agente de IA no WhatsApp a qualificar cada lead.
                </p>
              </div>
            </div>

            {/* Chips em mobile */}
            <div className="flex md:hidden flex-wrap gap-2 mb-6">
              {services.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-full text-xs text-foreground/85" style={{ background: "rgba(123,47,255,0.08)", border: "1px solid rgba(123,47,255,0.2)" }}>
                  {s}
                </span>
              ))}
            </div>

            <button onClick={openBooking} className="btn-glass !py-3 !px-6 !text-sm inline-flex items-center gap-2">
              Quero resultados como estes <ArrowRight size={14} />
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default CaseGracieBarra;
