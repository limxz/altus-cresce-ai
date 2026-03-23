import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ClientHealthScores from "@/components/admin/ClientHealthScores";
import {
  MessageCircle, Users, Bot, TrendingUp,
  Inbox, Zap, Phone, BarChart3
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

interface DashboardStats {
  totalConversations: number;
  totalMessages: number;
  hotLeads: number;
  conversionRate: number;
  totalMRR: number;
  activeClients: number;
  activeAgents: number;
  todayConversations: number;
}

interface ConversationDay {
  date: string;
  count: number;
}

const LEAD_COLORS: Record<string, string> = {
  novo: "#6B7280",
  interessado: "#3B82F6",
  marcou_consulta: "#10B981",
  cliente: "#7C3AED",
  perdido: "#EF4444",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positivo: "#10B981",
  neutro: "#6B7280",
  negativo: "#EF4444",
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0, totalMessages: 0, hotLeads: 0,
    conversionRate: 0, totalMRR: 0, activeClients: 0,
    activeAgents: 0, todayConversations: 0,
  });
  const [leadDistribution, setLeadDistribution] = useState<{ name: string; value: number }[]>([]);
  const [sentimentDistribution, setSentimentDistribution] = useState<{ name: string; value: number }[]>([]);
  const [dailyConversations, setDailyConversations] = useState<ConversationDay[]>([]);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const [convosRes, clientsRes, agentsRes, messagesRes] = await Promise.all([
      supabase.from("whatsapp_conversations").select("*"),
      supabase.from("clients").select("id, business_name, mrr, status"),
      supabase.from("whatsapp_agents").select("id, is_active"),
      supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }),
    ]);

    const convos = convosRes.data || [];
    const clients = clientsRes.data || [];
    const agents = agentsRes.data || [];
    const totalMessages = messagesRes.count || 0;

    const today = new Date().toDateString();
    const todayConvos = convos.filter(c => c.started_at && new Date(c.started_at).toDateString() === today).length;
    const hotLeads = convos.filter(c => c.lead_status === "interessado" || c.lead_status === "marcou_consulta").length;
    const totalConvos = convos.length;
    const converted = convos.filter(c => c.lead_status === "cliente").length;

    setStats({
      totalConversations: totalConvos,
      totalMessages,
      hotLeads,
      conversionRate: totalConvos > 0 ? Math.round((converted / totalConvos) * 100) : 0,
      totalMRR: clients.reduce((sum, c) => sum + (Number(c.mrr) || 0), 0),
      activeClients: clients.filter(c => c.status === "active").length,
      activeAgents: agents.filter(a => a.is_active).length,
      todayConversations: todayConvos,
    });

    // Lead distribution
    const leadCounts: Record<string, number> = {};
    convos.forEach(c => { leadCounts[c.lead_status || "novo"] = (leadCounts[c.lead_status || "novo"] || 0) + 1; });
    setLeadDistribution(Object.entries(leadCounts).map(([name, value]) => ({ name, value })));

    // Sentiment distribution
    const sentCounts: Record<string, number> = {};
    convos.forEach(c => { sentCounts[c.sentiment || "neutro"] = (sentCounts[c.sentiment || "neutro"] || 0) + 1; });
    setSentimentDistribution(Object.entries(sentCounts).map(([name, value]) => ({ name, value })));

    // Daily conversations (last 30 days)
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    convos.forEach(c => {
      if (c.started_at) {
        const d = new Date(c.started_at).toISOString().slice(0, 10);
        if (days[d] !== undefined) days[d]++;
      }
    });
    setDailyConversations(Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count })));

    // Recent conversations
    const recent = [...convos]
      .sort((a, b) => new Date(b.last_message_at || b.started_at || 0).getTime() - new Date(a.last_message_at || a.started_at || 0).getTime())
      .slice(0, 8);
    setRecentConversations(recent);

    setLoading(false);
  };

  const kpis = [
    { label: "Conversas", value: stats.totalConversations, icon: MessageCircle, color: "text-primary" },
    { label: "Mensagens", value: stats.totalMessages, icon: Zap, color: "text-accent" },
    { label: "Leads Quentes", value: stats.hotLeads, icon: TrendingUp, color: "text-green-400" },
    { label: "Conversão", value: `${stats.conversionRate}%`, icon: BarChart3, color: "text-blue-400" },
    { label: "MRR (€)", value: `€${stats.totalMRR}`, icon: Inbox, color: "text-amber-400" },
    { label: "Clientes Ativos", value: stats.activeClients, icon: Users, color: "text-purple-400" },
    { label: "Agentes Ativos", value: stats.activeAgents, icon: Bot, color: "text-cyan-400" },
    { label: "Hoje", value: stats.todayConversations, icon: Phone, color: "text-pink-400" },
  ];

  const LEAD_STATUS_LABELS: Record<string, string> = {
    novo: "Novo", interessado: "Interessado", marcou_consulta: "Marcou consulta",
    cliente: "Cliente", perdido: "Perdido",
  };

  const timeAgo = (date: string | null) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `há ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-3" />
              <div className="h-8 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Health Scores */}
      <ClientHealthScores />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-card p-5 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-xs uppercase tracking-widest">{kpi.label}</span>
              <kpi.icon size={18} className={kpi.color} />
            </div>
            <div className="font-display text-2xl text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Conversations */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-foreground font-medium mb-4 text-sm">Conversas — Últimos 30 dias</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyConversations}>
                <XAxis dataKey="date" stroke="hsl(240 5% 60%)" fontSize={10} interval={4} />
                <YAxis stroke="hsl(240 5% 60%)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(248 32% 9%)",
                    border: "1px solid hsl(262 83% 58% / 0.2)",
                    borderRadius: "8px",
                    color: "hsl(240 5% 95%)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-foreground font-medium mb-4 text-sm">Distribuição de Leads</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${LEAD_STATUS_LABELS[name] || name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {leadDistribution.map((entry) => (
                    <Cell key={entry.name} fill={LEAD_COLORS[entry.name] || "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(248 32% 9%)",
                    border: "1px solid hsl(262 83% 58% / 0.2)",
                    borderRadius: "8px",
                    color: "hsl(240 5% 95%)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sentiment + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment */}
        <div className="glass-card p-6">
          <h3 className="text-foreground font-medium mb-4 text-sm">Sentimento</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {sentimentDistribution.map((entry) => (
                    <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(248 32% 9%)",
                    border: "1px solid hsl(262 83% 58% / 0.2)",
                    borderRadius: "8px",
                    color: "hsl(240 5% 95%)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {sentimentDistribution.map(s => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: SENTIMENT_COLORS[s.name] || "#6B7280" }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-foreground font-medium mb-4 text-sm">Atividade Recente</h3>
          <div className="space-y-3">
            {recentConversations.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem atividade recente.</p>
            ) : (
              recentConversations.map(c => {
                const ls = LEAD_STATUS_LABELS[c.lead_status] || "Novo";
                const color = LEAD_COLORS[c.lead_status] || "#6B7280";
                return (
                  <div key={c.id} className="flex items-center gap-3 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-foreground font-medium truncate">{c.contact_name || c.contact_phone}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium`} style={{ background: `${color}22`, color }}>{ls}</span>
                    {c.classification_summary && (
                      <span className="text-muted-foreground text-xs truncate hidden sm:inline">{c.classification_summary}</span>
                    )}
                    <span className="ml-auto text-muted-foreground text-xs shrink-0">{timeAgo(c.last_message_at)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
