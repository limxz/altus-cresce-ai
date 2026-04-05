import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MessageCircle, Instagram, Clock, TrendingUp, Settings2, Save } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ROITab = () => {
  const { client } = useClientAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  const { toast } = useToast();

  const [hotConvos, setHotConvos] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [baseline, setBaseline] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; value: number }[]>([]);
  const [period, setPeriod] = useState("month");

  // Parâmetros da fórmula de ROI (de roi_settings do cliente ou defaults)
  const roiSettings = (client as any)?.roi_settings || {};
  const avgTicket: number = roiSettings.avg_ticket ?? 150;
  const conversionRate: number = roiSettings.conversion_rate ?? 0.15;

  // Admin override state
  const [showOverride, setShowOverride] = useState(false);
  const [override, setOverride] = useState({
    hot_convos: 0,
    followers: 0,
    baseline: 0,
    avg_value: 150,
    hours_saved: 0,
    hour_rate: 15,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    loadData();
  }, [client, period]);

  const loadData = async () => {
    if (!client) return;

    const { count } = await supabase
      .from("whatsapp_conversations")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .in("lead_status", ["interessado", "marcou_consulta"]);
    setHotConvos(count || 0);

    const { data: metrics } = await supabase
      .from("metrics")
      .select("instagram_followers, date")
      .eq("client_id", client.id)
      .order("date", { ascending: true });

    if (metrics && metrics.length > 0) {
      setFollowers(metrics[metrics.length - 1].instagram_followers || 0);
      setBaseline(client.instagram_baseline || 0);

      const chartData = metrics.map(m => {
        const followerGrowth = (m.instagram_followers || 0) - (client.instagram_baseline || 0);
        const leadsValue = (count || 0) * avgTicket * conversionRate;
        return {
          month: new Date(m.date).toLocaleDateString("pt-PT", { month: "short" }),
          value: Math.round(leadsValue + followerGrowth * 0.5),
        };
      });
      setMonthlyData(chartData);
    }

    // Init override with real data
    setOverride(prev => ({
      ...prev,
      hot_convos: count || 0,
      followers: metrics?.length ? metrics[metrics.length - 1].instagram_followers || 0 : 0,
      baseline: client.instagram_baseline || 0,
      hours_saved: Math.round((count || 0) * 0.5 + 20),
    }));
  };

  const saveOverride = async () => {
    if (!client) return;
    setSaving(true);

    // Update the latest metrics row with overridden followers
    const { data: latest } = await supabase
      .from("metrics")
      .select("id")
      .eq("client_id", client.id)
      .order("date", { ascending: false })
      .limit(1);

    if (latest && latest.length > 0) {
      await supabase
        .from("metrics")
        .update({ instagram_followers: override.followers } as any)
        .eq("id", latest[0].id);
    }

    // Update baseline on client
    await supabase
      .from("clients" as any)
      .update({ instagram_baseline: override.baseline } as any)
      .eq("id", client.id);

    setHotConvos(override.hot_convos);
    setFollowers(override.followers);
    setBaseline(override.baseline);

    setSaving(false);
    toast({ title: "ROI atualizado com sucesso!" });
  };

  if (!client) return null;

  // Use override values if admin is tweaking, otherwise use real data
  const displayConvos = showOverride ? override.hot_convos : hotConvos;
  const displayFollowers = showOverride ? override.followers : followers;
  const displayBaseline = showOverride ? override.baseline : baseline;
  const avgValue = showOverride ? override.avg_value : 150;
  const hourRate = showOverride ? override.hour_rate : 15;

  const botROI = Math.round(displayConvos * avgValue * conversionRate);
  const followersGained = Math.max(0, displayFollowers - displayBaseline);
  const igROI = Math.round(followersGained * 0.5);
  const hoursSaved = showOverride ? override.hours_saved : Math.round(displayConvos * 0.5 + 20);
  const timeROI = hoursSaved * hourRate;
  const totalROI = botROI + igROI + timeROI;
  const mrr = Number(client.mrr) || 297;
  const ratio = mrr > 0 ? (totalROI / mrr).toFixed(1) : "0";
  const ratioNum = parseFloat(ratio);

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider block mb-1";

  return (
    <div className="space-y-6">
      {/* Admin Override Panel */}
      {isAdmin && (
        <div className="glass-card p-4 border border-amber-500/30 bg-amber-500/5">
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="flex items-center gap-2 text-sm text-amber-400 font-medium w-full"
          >
            <Settings2 size={16} />
            {showOverride ? "Fechar painel de override" : "Personalizar valores de ROI"}
          </button>
          {showOverride && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                A IA calcula automaticamente. Edita apenas se necessário corrigir valores.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Conversas quentes</label>
                  <input type="number" value={override.hot_convos} onChange={e => setOverride(p => ({ ...p, hot_convos: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Valor médio/conversa (€)</label>
                  <input type="number" value={override.avg_value} onChange={e => setOverride(p => ({ ...p, avg_value: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Seguidores IG atuais</label>
                  <input type="number" value={override.followers} onChange={e => setOverride(p => ({ ...p, followers: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Baseline IG</label>
                  <input type="number" value={override.baseline} onChange={e => setOverride(p => ({ ...p, baseline: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Horas poupadas</label>
                  <input type="number" value={override.hours_saved} onChange={e => setOverride(p => ({ ...p, hours_saved: +e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Valor/hora (€)</label>
                  <input type="number" value={override.hour_rate} onChange={e => setOverride(p => ({ ...p, hour_rate: +e.target.value }))} className={inputClass} />
                </div>
              </div>
              <button
                onClick={saveOverride}
                disabled={saving}
                className="btn-primary !px-5 !py-2 !text-sm !rounded-lg flex items-center gap-2"
              >
                <Save size={14} /> {saving ? "A guardar..." : "Guardar alterações"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hero ROI */}
      <div className="glass-card p-8 text-center bg-gradient-to-br from-primary/10 to-accent/5">
        <p className="text-muted-foreground text-sm mb-2">A Altus Media gerou para o teu negócio:</p>
        <div className="font-display text-5xl md:text-6xl text-primary mb-1">€{totalROI}</div>
        <p className="text-muted-foreground text-sm">este mês</p>
      </div>

      {/* Breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: MessageCircle, label: "Bot WhatsApp", detail: `${displayConvos} conversas quentes`, value: `€${botROI}`, color: "text-primary" },
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
          {/* Fórmula transparente */}
          <div className="mt-4 p-3 bg-muted/40 rounded-lg border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-muted-foreground/70 uppercase tracking-wider text-[10px] block mb-1">Como calculamos</span>
              <strong className="text-foreground/80">{displayConvos} leads</strong>
              {" × "}
              <strong className="text-foreground/80">€{avgValue}</strong>
              {" × "}
              <strong className="text-foreground/80">{Math.round(conversionRate * 100)}%</strong>
              {" = "}
              <strong className="text-primary">€{Math.round(displayConvos * avgValue * conversionRate)}</strong>
              {" de leads · mais "}
              <strong className="text-foreground/80">+{Math.max(0, displayFollowers - displayBaseline)} seguidores</strong>
              {" × €0,50 = "}
              <strong className="text-pink-400">€{Math.round(Math.max(0, displayFollowers - displayBaseline) * 0.5)}</strong>
              {" em alcance orgânico"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROITab;
