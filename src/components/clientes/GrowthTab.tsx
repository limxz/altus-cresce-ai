import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Rocket, Star, Flame, Diamond, Lock } from "lucide-react";

const ACHIEVEMENTS = [
  { icon: Trophy, label: "Primeiro lead via bot", key: "first_lead" },
  { icon: Rocket, label: "100 seguidores conquistados", key: "100_followers" },
  { icon: Star, label: "30 dias de conteúdo", key: "30_days" },
  { icon: Flame, label: "10 leads num mês", key: "10_leads" },
  { icon: Diamond, label: "Dobrámos os seguidores", key: "double_followers" },
];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(248 32% 9%)",
    border: "1px solid hsl(262 83% 58% / 0.2)",
    borderRadius: "8px",
    color: "hsl(240 5% 95%)",
    fontSize: 12,
  },
};

const GrowthTab = () => {
  const { client } = useClientAuth();
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>(null);

  useEffect(() => {
    if (!client) return;
    supabase.from("metrics" as any).select("*").eq("client_id", client.id).order("date", { ascending: true })
      .then(({ data }) => {
        if (data && (data as any[]).length > 0) {
          setMetricsHistory(data as any[]);
          setLatestMetrics((data as any[])[(data as any[]).length - 1]);
        }
      });
  }, [client]);

  if (!client) return null;

  const igNow = latestMetrics?.instagram_followers || client.instagram_baseline;
  const leadsNow = latestMetrics?.leads_count || client.leads_baseline;
  const postsNow = latestMetrics?.posts_published || 0;
  const igBase = client.instagram_baseline || 1;
  const leadsBase = client.leads_baseline || 1;

  const igGrowth = Math.round(((igNow - igBase) / igBase) * 100);
  const leadsGrowth = Math.round(((leadsNow - leadsBase) / leadsBase) * 100);

  const followerData = metricsHistory.map(m => ({
    date: new Date(m.date).toLocaleDateString("pt-PT", { month: "short" }),
    followers: m.instagram_followers,
  }));

  const leadsData = metricsHistory.slice(-8).map(m => ({
    week: new Date(m.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
    leads: m.leads_count,
  }));

  // Check achievements
  const unlockedAchievements = new Set<string>();
  if (leadsNow > 0) unlockedAchievements.add("first_lead");
  if (igNow >= 100) unlockedAchievements.add("100_followers");
  if (metricsHistory.length >= 30) unlockedAchievements.add("30_days");
  if (leadsNow >= 10) unlockedAchievements.add("10_leads");
  if (igNow >= igBase * 2) unlockedAchievements.add("double_followers");

  const comparison = [
    { metric: "Seguidores IG", before: igBase, now: igNow, growth: `+${igGrowth}%` },
    { metric: "Leads/mês", before: leadsBase, now: leadsNow, growth: `+${leadsGrowth}%` },
    { metric: "Posts/mês", before: 1, now: postsNow || 1, growth: `+${Math.round(((postsNow || 1) - 1) * 100)}%` },
    { metric: "Resp. cliente", before: "6h", now: "Instantâneo", growth: "✅" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-foreground">O crescimento do teu negócio</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Desde {client.start_date ? new Date(client.start_date).toLocaleDateString("pt-PT") : "o início"} até hoje
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-foreground font-medium text-sm mb-4">Seguidores ao Longo do Tempo</h3>
          <div className="h-52">
            {followerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={followerData}>
                  <defs>
                    <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="hsl(240 5% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(240 5% 60%)" fontSize={11} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="followers" stroke="hsl(262 83% 58%)" fill="url(#followerGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-foreground font-medium text-sm mb-4">Leads por Período</h3>
          <div className="h-52">
            {leadsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsData}>
                  <XAxis dataKey="week" stroke="hsl(240 5% 60%)" fontSize={11} />
                  <YAxis stroke="hsl(240 5% 60%)" fontSize={11} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="leads" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
            )}
          </div>
        </div>
      </div>

      {/* Before vs Now */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider" />
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Quando começámos</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Hoje</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Crescimento</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-5 py-3 text-foreground font-medium">{row.metric}</td>
                <td className="px-5 py-3 text-muted-foreground">{row.before}</td>
                <td className="px-5 py-3 text-foreground font-medium">{row.now}</td>
                <td className="px-5 py-3 text-green-400">{row.growth} ✅</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-foreground font-medium text-sm mb-4">Conquistas</h3>
        <div className="flex flex-wrap gap-3">
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedAchievements.has(a.key);
            return (
              <div
                key={a.key}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                  unlocked
                    ? "glass-card border-primary/30"
                    : "bg-muted/30 border border-border opacity-40"
                }`}
              >
                {unlocked ? <a.icon size={18} className="text-accent" /> : <Lock size={18} className="text-muted-foreground" />}
                <span className={`text-sm ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>{a.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GrowthTab;
