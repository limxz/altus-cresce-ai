import { useEffect, useState } from "react";
import { FadeIn } from "./FadeIn";
import { supabase } from "@/integrations/supabase/client";
import {
  Image as ImageIcon,
  MessageCircle,
  LineChart,
  Video,
  LayoutDashboard,
  MessageSquareQuote,
} from "lucide-react";

type ProofType =
  | "screenshot"
  | "video"
  | "testemunho"
  | "dashboard"
  | "conversa"
  | "outro";

interface ProofRow {
  id: string;
  type: ProofType;
  title: string;
  description: string | null;
  media_url: string | null;
  client_name: string | null;
  featured: boolean;
}

const iconFor = (t: ProofType) =>
  ({
    screenshot: ImageIcon,
    video: Video,
    testemunho: MessageSquareQuote,
    dashboard: LayoutDashboard,
    conversa: MessageCircle,
    outro: LineChart,
  }[t] || ImageIcon);

const tagFor = (t: ProofType) =>
  ({
    screenshot: "Screenshot",
    video: "Vídeo",
    testemunho: "Testemunho",
    dashboard: "Dashboard",
    conversa: "Conversa",
    outro: "Prova",
  }[t] || "Prova");

const fallback: ProofRow[] = [
  { id: "f1", type: "screenshot", title: "Campanha com CPA de 3,80€", description: "Anúncio para escola local com CTR acima de 4%.", media_url: null, client_name: null, featured: true },
  { id: "f2", type: "conversa", title: "Conversa qualificada em 40s", description: "Agente de IA marcou aula experimental automaticamente.", media_url: null, client_name: null, featured: false },
  { id: "f3", type: "dashboard", title: "+189% conversões", description: "Comparação antes / depois em 60 dias.", media_url: null, client_name: null, featured: false },
  { id: "f4", type: "screenshot", title: "Página com 22% de conversão", description: "Substituiu website antigo que convertia a 1,8%.", media_url: null, client_name: null, featured: true },
  { id: "f5", type: "testemunho", title: '"Marcámos 14 reuniões esta semana."', description: "Mensagem real recebida no WhatsApp.", media_url: null, client_name: null, featured: false },
  { id: "f6", type: "video", title: "Testemunho em vídeo", description: "Cliente conta o antes e depois em 90 segundos.", media_url: null, client_name: null, featured: true },
];

const spanFor = (i: number, featured: boolean) => {
  if (featured && i % 3 === 0) return "md:col-span-2";
  if (featured) return "md:col-span-2";
  return "";
};

const ProofsGrid = () => {
  const [items, setItems] = useState<ProofRow[]>(fallback);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("proofs")
        .select("id, type, title, description, media_url, client_name, featured")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (data && data.length > 0) setItems(data as ProofRow[]);
    })();
  }, []);

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

        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[220px] gap-4">
          {items.map((p, i) => {
            const Icon = iconFor(p.type);
            return (
              <FadeIn key={p.id} delay={i * 0.05} className={spanFor(i, p.featured)}>
                <div className="glass-card h-full overflow-hidden relative group flex flex-col">
                  {p.media_url ? (
                    p.type === "video" ? (
                      <video src={p.media_url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" muted loop playsInline />
                    ) : (
                      <img src={p.media_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                    )
                  ) : (
                    <div
                      className="absolute inset-0 opacity-30 pointer-events-none"
                      style={{ background: "radial-gradient(circle at top right, rgba(123,47,255,0.15), transparent 60%)" }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent pointer-events-none" />
                  <div className="relative p-6 flex flex-col justify-between h-full">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(123,47,255,0.2), rgba(45,156,255,0.15))", border: "1px solid rgba(123,47,255,0.25)" }}>
                        <Icon size={16} className="text-accent" />
                      </div>
                      <span className="text-[0.625rem] font-mono tracking-[0.15em] uppercase text-muted-foreground/70">{tagFor(p.type)}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-foreground text-base mb-1.5" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>{p.title}</h3>
                      {p.description && (
                        <p className="text-muted-foreground text-[0.8125rem] leading-relaxed line-clamp-3">{p.description}</p>
                      )}
                      {p.client_name && (
                        <p className="text-[0.6875rem] font-mono uppercase tracking-widest text-accent/80 mt-2">{p.client_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProofsGrid;
