import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { Lightbulb, AlertTriangle, Rocket, Check, X, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  type: "Oportunidade" | "Alerta" | "Crescimento";
  title: string;
  explanation: string;
  impact: string;
}

const TYPE_STYLES: Record<string, { icon: any; badge: string; border: string }> = {
  Oportunidade: { icon: Lightbulb, badge: "bg-blue-900/50 text-blue-300", border: "border-blue-500/30" },
  Alerta: { icon: AlertTriangle, badge: "bg-amber-900/50 text-amber-300", border: "border-amber-500/30" },
  Crescimento: { icon: Rocket, badge: "bg-green-900/50 text-green-300", border: "border-green-500/30" },
};

const AILabTab = () => {
  const { client } = useClientAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [published, setPublished] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  const { toast } = useToast();

  useEffect(() => {
    if (client) generateSuggestions();
  }, [client]);

  const generateSuggestions = async () => {
    if (!client) return;

    const { data: metrics } = await supabase
      .from("metrics")
      .select("*")
      .eq("client_id", client.id)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    const { count: convosCount } = await supabase
      .from("whatsapp_conversations")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id);

    const leads = metrics?.leads_count || 0;
    const followers = metrics?.instagram_followers || 0;
    const posts = metrics?.posts_published || 0;
    const conversations = convosCount || 0;

    try {
      const res = await supabase.functions.invoke("generate-plan", {
        body: {
          customPrompt: true,
          system: "Gera exactamente 3 sugestões em JSON array. Responde APENAS com JSON válido, sem markdown.",
          user: `Analisa estes dados do cliente (${client.niche} em Braga): leads=${leads}, conversas=${conversations}, seguidores=${followers}, posts=${posts}. Gera 3 sugestões JSON: [{"type":"Oportunidade"|"Alerta"|"Crescimento","title":"título curto","explanation":"2-3 frases com dados reais","impact":"+X leads/mês ou Poupa X horas/semana"}]`,
        },
      });

      if (res.data?.plan_text) {
        const text = res.data.plan_text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setSuggestions(parsed);
        }
      }
    } catch (e) {
      setSuggestions([
        { type: "Oportunidade", title: "Activar respostas automáticas", explanation: `Com ${leads} leads este mês, podes converter mais com respostas instantâneas 24/7.`, impact: "+5 leads/mês" },
        { type: "Alerta", title: "Frequência de publicação baixa", explanation: `Apenas ${posts} posts publicados. O recomendado para o teu nicho são pelo menos 15 posts/mês.`, impact: "+30% engagement" },
        { type: "Crescimento", title: "Aproveitar tendência de seguidores", explanation: `Estás com ${followers} seguidores. Com conteúdo consistente, podes duplicar em 60 dias.`, impact: "+100% seguidores" },
      ]);
    }
    setLoading(false);
  };

  const publishSuggestion = (idx: number) => {
    setPublished(p => [...p, idx]);
    toast({ title: "Sugestão publicada no portal do cliente!" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-48" />
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-32 mb-3" />
            <div className="h-3 bg-muted rounded w-full mb-2" />
            <div className="h-3 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const visible = suggestions.filter((_, i) => !dismissed.includes(i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-lg font-display font-bold">Ideias da IA para o teu negócio</h2>
        <p className="text-muted-foreground text-sm">Actualizadas com base nos teus dados reais</p>
      </div>

      {visible.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Check size={32} className="mx-auto text-green-400 mb-2" />
          <p className="text-foreground font-medium">Tudo em dia!</p>
          <p className="text-muted-foreground text-sm">Todas as sugestões foram tratadas esta semana.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((s, idx) => {
            const realIdx = suggestions.indexOf(s);
            const style = TYPE_STYLES[s.type] || TYPE_STYLES.Oportunidade;
            const Icon = style.icon;
            const isPublished = published.includes(realIdx);
            return (
              <motion.div
                key={realIdx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-card p-5 border ${style.border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${style.badge}`}>
                      <Icon size={12} />
                      {s.type === "Oportunidade" ? "💡" : s.type === "Alerta" ? "⚠️" : "🚀"} {s.type}
                    </span>
                    {isPublished && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">
                        ✓ Publicado
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-foreground font-medium mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{s.explanation}</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary text-sm font-medium">{s.impact}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDismissed(p => [...p, realIdx])}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <X size={12} /> Ignorar
                    </button>
                    {isAdmin && !isPublished && (
                      <button
                        onClick={() => publishSuggestion(realIdx)}
                        className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-1"
                      >
                        <Send size={12} /> Publicar
                      </button>
                    )}
                    <button className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors flex items-center gap-1">
                      <Check size={12} /> Implementar
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AILabTab;
