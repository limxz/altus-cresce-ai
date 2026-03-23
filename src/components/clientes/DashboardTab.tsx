import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageCircle, Instagram, Activity, Clock } from "lucide-react";

const DashboardTab = () => {
  const { client } = useClientAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [prevMetrics, setPrevMetrics] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!client) return;
    // Fetch latest metrics
    supabase.from("metrics" as any).select("*").eq("client_id", client.id).order("date", { ascending: false }).limit(2)
      .then(({ data }) => {
        if (data && (data as any[]).length > 0) {
          setMetrics((data as any[])[0]);
          if ((data as any[]).length > 1) setPrevMetrics((data as any[])[1]);
        }
      });
    // Fetch upcoming posts
    supabase.from("content_posts" as any).select("*").eq("client_id", client.id)
      .in("status", ["pending", "approved"]).order("scheduled_at", { ascending: true }).limit(3)
      .then(({ data }) => { if (data) setPosts(data as any[]); });
    // Fetch recent conversations
    supabase.from("client_conversations" as any).select("*, client_messages(*)").eq("client_id", client.id)
      .order("last_message_at", { ascending: false }).limit(5)
      .then(({ data }) => { if (data) setActivities(data as any[]); });
  }, [client]);

  const igFollowers = metrics?.instagram_followers || client?.instagram_baseline || 0;
  const igGrowth = prevMetrics ? igFollowers - (prevMetrics.instagram_followers || 0) : 0;
  const leadsCount = metrics?.leads_count || 0;
  const prevLeads = prevMetrics?.leads_count || 0;
  const leadsGrowth = prevLeads > 0 ? Math.round(((leadsCount - prevLeads) / prevLeads) * 100) : 0;
  const botConvos = metrics?.bot_conversations || 0;
  const healthScore = metrics?.health_score || 50;

  const healthColor = healthScore >= 80 ? "text-green-400" : healthScore >= 60 ? "text-yellow-400" : "text-red-400";
  const healthLabel = healthScore >= 80 ? "Excelente 🚀" : healthScore >= 60 ? "Bom 📈" : "A melhorar 💪";

  const kpis = [
    {
      label: "Leads Este Mês",
      value: leadsCount,
      sub: leadsGrowth !== 0 ? `${leadsGrowth > 0 ? "+" : ""}${leadsGrowth}% vs mês passado` : "Sem dados anteriores",
      icon: Users,
      subColor: leadsGrowth >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Conversas do Bot",
      value: botConvos,
      sub: "Tempo de resposta: instantâneo 24/7",
      icon: MessageCircle,
      subColor: "text-muted-foreground",
    },
    {
      label: "Seguidores Instagram",
      value: igFollowers,
      sub: igGrowth !== 0 ? `${igGrowth > 0 ? "+" : ""}${igGrowth} este mês` : "Sem alterações",
      icon: Instagram,
      subColor: igGrowth >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Saúde do Negócio",
      value: `${healthScore}`,
      sub: healthLabel,
      icon: Activity,
      subColor: healthColor,
      isHealth: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-card p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground text-xs uppercase tracking-widest">{kpi.label}</span>
                <kpi.icon size={16} className="text-accent" />
              </div>
              {kpi.isHealth ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <circle
                        cx="32" cy="32" r="28" fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={`${(healthScore / 100) * 175.9} 175.9`}
                        className={healthColor}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${healthColor}`}>
                      {healthScore}
                    </span>
                  </div>
                  <span className={`text-sm ${kpi.subColor}`}>{kpi.sub}</span>
                </div>
              ) : (
                <>
                  <div className="font-display text-3xl text-foreground">{kpi.value}</div>
                  <p className={`text-xs mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-5">
          <h3 className="text-foreground font-medium text-sm mb-4">Atividade Recente</h3>
          {activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sem atividade recente</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div>
                    <span className="text-foreground">
                      Bot respondeu a {a.contact_name || "contacto"} via {a.bot_type}
                    </span>
                    <div className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {a.last_message_at ? new Date(a.last_message_at).toLocaleString("pt-PT") : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Posts */}
        <div className="glass-card p-5">
          <h3 className="text-foreground font-medium text-sm mb-4">Próximos Posts</h3>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum post agendado</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p: any) => (
                <div key={p.id} className="flex gap-3 items-start">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Instagram size={20} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">{p.caption?.substring(0, 80) || "Sem legenda"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground text-xs">
                        {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString("pt-PT") : "Sem data"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {p.status === "approved" ? "Aprovado" : "Aguarda aprovação"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
