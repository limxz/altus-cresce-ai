import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface ClientHealth {
  id: string;
  business_name: string;
  brand_color: string | null;
  health: number;
}

const ClientHealthScores = () => {
  const [clients, setClients] = useState<ClientHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthScores();
  }, []);

  const fetchHealthScores = async () => {
    const [clientsRes, metricsRes, convosRes] = await Promise.all([
      supabase.from("clients").select("id, business_name, brand_color, status").eq("status", "active"),
      supabase.from("metrics").select("client_id, leads_count, posts_published, bot_conversations, date").order("date", { ascending: false }),
      supabase.from("whatsapp_conversations").select("client_id, started_at").order("started_at", { ascending: false }),
    ]);

    const allClients = clientsRes.data || [];
    const allMetrics = metricsRes.data || [];
    const allConvos = convosRes.data || [];

    const scored = allClients.map(c => {
      const latestMetric = allMetrics.find(m => m.client_id === c.id);
      const lastConvo = allConvos.find(cv => cv.client_id === c.id);

      const posts = latestMetric?.posts_published || 0;
      const leads = latestMetric?.leads_count || 0;
      const postsScore = Math.min(25, (posts / Math.max(10, 1)) * 25);
      const leadsScore = Math.min(25, (leads / Math.max(5, 1)) * 25);
      const approvalScore = 15; // default

      const botDays = lastConvo?.started_at
        ? (Date.now() - new Date(lastConvo.started_at).getTime()) / 86400000
        : 999;
      const botScore = botDays < 2 ? 25 : botDays < 7 ? 15 : 0;

      const health = Math.min(100, Math.round(postsScore + leadsScore + approvalScore + botScore));

      return { id: c.id, business_name: c.business_name, brand_color: c.brand_color, health };
    });

    scored.sort((a, b) => a.health - b.health);
    setClients(scored);
    setLoading(false);
  };

  const getHealthStyle = (score: number) => {
    if (score >= 80) return { color: "text-green-400", bg: "bg-green-500", label: "Excelente" };
    if (score >= 60) return { color: "text-amber-400", bg: "bg-amber-500", label: "Atenção" };
    return { color: "text-red-400", bg: "bg-red-500", label: "Em risco" };
  };

  const atRisk = clients.filter(c => c.health < 65);

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="h-4 bg-muted rounded w-40 mb-4" />
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-32 h-20 bg-muted rounded-lg animate-pulse shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-foreground font-medium text-sm">Estado dos Clientes</h3>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {clients.map((c, i) => {
          const style = getHealthStyle(c.health);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-3 min-w-[140px] shrink-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                  style={{ background: c.brand_color || "hsl(var(--primary))" }}
                >
                  {c.business_name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-foreground text-xs font-medium truncate">{c.business_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${style.color}`}>{c.health}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${style.bg} ${c.health < 60 ? "animate-pulse" : ""}`}
                    style={{ width: `${c.health}%` }}
                  />
                </div>
              </div>
              <span className={`text-[10px] ${style.color}`}>{style.label}</span>
            </motion.div>
          );
        })}
      </div>

      {atRisk.length > 0 && (
        <div className="glass-card border-red-500/30 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span className="text-red-400">
            ⚠️ {atRisk.length} cliente{atRisk.length > 1 ? "s" : ""} precisa{atRisk.length > 1 ? "m" : ""} de atenção:{" "}
            {atRisk.map(c => c.business_name).join(", ")}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClientHealthScores;
