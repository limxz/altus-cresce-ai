import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MessageCircle, Instagram, Clock, TrendingUp } from "lucide-react";

const ROITab = () => {
  const { client } = useClientAuth();
  const [hotConvos, setHotConvos] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [baseline, setBaseline] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([]);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    if (!client) return;
    loadData();
  }, [client, period]);

  const loadData = async () => {
    if (!client) return;

    // Hot conversations
    const { count } = await supabase
      .from("whatsapp_conversations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .in("lead_status", ["interessado", "marcou_consulta"]);
    setHotConvos(count || 0);

    // Metrics for followers
    const { data: metrics } = await supabase
      .from("metrics")
      .select("instagram_followers, date")
      .eq("client_id", client.id)
      .order("date", { ascending: true });

    if (metrics && metrics.length > 0) {
      setFollowers(metrics[metrics.length - 1].instagram_followers || 0);
      setBaseline(client.instagram_baseline || 0);

      // Build monthly chart data
      const chartData = metrics.map(m => ({
        month: new Date(m.date).toLocaleDateString("pt-PT", { month: "short" }),
        value: ((m.instagram_followers || 0) - (client.instagram_baseline || 0)) * 2 + (count || 0) * 150,
      }));
      setMonthlyData(chartData);
    }
  };

  if (!client) return null;

  const avgValue = 150;
  const botROI = hotConvos * avgValue;
  const followersGained = Math.max(0, followers - baseline);
  const igROI = Math.round(followersGained * 2);
  const hoursSaved = Math.round(hotConvos * 0.5 + 20);
  const timeROI = hoursSaved * 15;
  const totalROI = botROI + igROI + timeROI;
  const mrr = Number(client.mrr) || 297;
  const ratio = mrr > 0 ? (totalROI / mrr).toFixed(1) : "0";
  const ratioNum = parseFloat(ratio);

  return (
    <div className="space-y-6">
      {/* Hero ROI */}
      <div className="glass-card p-8 text-center bg-gradient-to-br from-primary/10 to-accent/5">
        <p className="text-muted-foreground text-sm mb-2">A Altus Media gerou para o teu negócio:</p>
        <div className="font-display text-5xl md:text-6xl text-primary mb-1">€{totalROI}</div>
        <p className="text-muted-foreground text-sm">este mês</p>
      </div>

      {/* Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: MessageCircle, label: "Bot WhatsApp", detail: `${hotConvos} conversas quentes`, value: `€${botROI}`, color: "text-primary" },
          { icon: Instagram, label: "Instagram", detail: `+${followersGained} seguidores`, value: `€${igROI}`, color: "text-pink-400" },
          { icon: Clock, label: "Tempo poupado", detail: `${hoursSaved}h poupadas`, value: `€${timeROI}`, color: "text-amber-400" },
        ].map((card, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={18} className={card.color} />
              <span className="text-foreground text-sm font-medium">{card.label}</span>
            </div>
            <p className="text-muted-foreground text-xs mb-1">{card.detail}</p>
            <p className={`font-display text-2xl ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ROI Ratio */}
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground text-sm mb-1">Por cada €1 que investiste, recebeste:</p>
        <p className={`font-display text-4xl ${ratioNum > 3 ? "text-green-400" : ratioNum > 1 ? "text-amber-400" : "text-red-400"}`}>
          €{ratio} de volta
        </p>
      </div>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground text-sm font-medium flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> ROI Acumulado
            </h3>
            <div className="flex gap-2">
              {["month", "3months", "all"].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded text-xs ${period === p ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {p === "month" ? "Este mês" : p === "3months" ? "3 meses" : "Desde o início"}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="hsl(240 5% 60%)" fontSize={10} />
                <YAxis stroke="hsl(240 5% 60%)" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(248 32% 9%)", border: "1px solid hsl(262 83% 58% / 0.2)", borderRadius: "8px", color: "hsl(240 5% 95%)", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="hsl(262 83% 58%)" fill="url(#roiGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROITab;
