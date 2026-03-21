import { useState } from "react";
import { FileDown, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const defaultSlides = [
  { title: "Capa", content: "Altus Media — Cresce com Inteligência" },
  { title: "Sobre Nós", content: "Somos uma agência de marketing com IA que ajuda negócios locais a crescer." },
  { title: "Serviços", content: "Gestão de Redes Sociais, Meta & Google Ads, Automações com IA" },
  { title: "Como Funciona", content: "1. Análise gratuita → 2. Estratégia com IA → 3. Recebe clientes" },
  { title: "Resultados", content: "Resultados reais com clientes satisfeitos" },
  { title: "Planos", content: "Starter €197/mês · Growth €297/mês · Pro €419/mês" },
  { title: "Próximos Passos", content: "Agendar chamada gratuita de 20 minutos" },
];

interface SlideData {
  title: string;
  content: string;
}

const Presentations = () => {
  const [clientName, setClientName] = useState("");
  const [clientBusiness, setClientBusiness] = useState("");
  const [slides, setSlides] = useState<SlideData[]>(defaultSlides);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateWithAI = async () => {
    if (!clientName || !clientBusiness) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-presentation", {
        body: { clientName, clientBusiness },
      });
      if (error) throw error;
      if (data?.slides) {
        setSlides(data.slides);
      }
    } catch (e) {
      console.error("Erro ao gerar:", e);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPPTX = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pptx", {
        body: { slides, clientName, clientBusiness },
      });
      if (error) throw error;

      // data is base64 encoded pptx
      const binary = atob(data.pptx);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Altus_Media_${clientName.replace(/\s+/g, "_")}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erro ao descarregar:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-foreground mb-4">Gerar Apresentação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nome do Cliente</label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Tipo de Negócio</label>
            <input
              value={clientBusiness}
              onChange={(e) => setClientBusiness(e.target.value)}
              placeholder="Ex: Restaurante, Clínica, Ginásio"
              className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateWithAI}
            disabled={generating || !clientName || !clientBusiness}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Gerar com IA
          </button>
          <button
            onClick={downloadPPTX}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 text-foreground text-sm font-semibold hover:bg-primary/10 disabled:opacity-50 transition-all"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            Descarregar PPTX
          </button>
        </div>
      </div>

      {/* Slide Preview */}
      <div>
        <h3 className="font-display text-lg text-foreground mb-3">Pré-visualização dos Slides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slides.map((slide, i) => (
            <div key={i} className="bg-card border border-primary/10 rounded-xl p-5 relative group">
              <span className="absolute top-2 right-3 text-xs text-muted-foreground/50">Slide {i + 1}</span>
              <input
                value={slide.title}
                onChange={(e) => {
                  const updated = [...slides];
                  updated[i] = { ...slide, title: e.target.value };
                  setSlides(updated);
                }}
                className="font-display text-base text-foreground bg-transparent border-none outline-none w-full mb-2"
              />
              <textarea
                value={slide.content}
                onChange={(e) => {
                  const updated = [...slides];
                  updated[i] = { ...slide, content: e.target.value };
                  setSlides(updated);
                }}
                rows={3}
                className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground resize-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Presentations;
