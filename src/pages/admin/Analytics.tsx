import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
  FunnelChart, Funnel, LabelList
} from "recharts";
import { TrendingUp, Users, Bot, MessageCircle, Target, Download } from "lucide-react";

const LEAD_COLORS: Record<string, string> = {
  novo: "#6B7280", interessado: "#3B82F6", marcou_consulta: "#10B981",
  cliente: "#7C3AED", perdido: "#EF4444",
};
const LEAD_LABELS: Record<string, string> = {
  novo: "Novo", interessado: "Interessado", marcou_consulta: "Marcou",
  cliente: "Cliente", perdido: "Perdido",
};
const SENTIMENT_COLORS: Record<string, string> = {
  positivo: "#10B981", neutro: "#6B7280", negativo: "#EF4444",
};

const tooltipStyle = {
  background: "hsl(248 32% 9%)",
  border: "1px solid hsl(262 83% 58% / 0.2)",
  borderRadius: "8px",
  color: "hsl(240 5% 95%)",
  fontSize: 12,
};

const Analytics = () => {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [convos, setConvos] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [convosRes, agentsRes, clientsRes] = await Promise.all([
      supabase.from("whatsapp_conversations").select("*"),
      supabase.from("whatsapp_agents").select("*, clients(business_name)"),
      supabase.from("clients").select("*"),
    ]);

    const c = convosRes.data || [];
    setConvos(c);
    setAgents(agentsRes.data || []);
    setClients(clientsRes.data || []);

    // Daily data (30 days)
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    c.forEach(cv => {
      if (cv.started_at) {
        const d = new Date(cv.started_at).toISOString().slice(0, 10);
        if (days[d] !== undefined) days[d]++;
      }
    });
    setDailyData(Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count })));
    setLoading(false);
  };

  // Computed data
  const leadDist = (() => {
    const counts: Record<string, number> = {};
    convos.forEach(c => { counts[c.lead_status || "novo"] = (counts[c.lead_status || "novo"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: LEAD_LABELS[name] || name, value, key: name }));
  })();

  const sentimentDist = (() => {
    const counts: Record<string, number> = {};
    convos.forEach(c => { counts[c.sentiment || "neutro"] = (counts[c.sentiment || "neutro"] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const funnelData = (() => {
    const stages = ["novo", "interessado", "marcou_consulta", "cliente"];
    return stages.map(s => ({
      name: LEAD_LABELS[s],
      value: convos.filter(c => stages.indexOf(c.lead_status || "novo") >= stages.indexOf(s)).length,
      fill: LEAD_COLORS[s],
    }));
  })();

  const agentPerformance = agents.map(a => ({
    name: a.agent_name,
    client: (a.clients as any)?.business_name || "—",
    conversations: a.total_conversations || 0,
    messages: a.total_messages || 0,
    active: a.is_active,
  })).sort((a, b) => b.conversations - a.conversations);

  const clientPerformance = (() => {
    const clientConvos: Record<string, number> = {};
    const clientLeads: Record<string, number> = {};
    convos.forEach(c => {
      clientConvos[c.client_id] = (clientConvos[c.client_id] || 0) + 1;
      if (c.lead_status === "interessado" || c.lead_status === "marcou_consulta") {
        clientLeads[c.client_id] = (clientLeads[c.client_id] || 0) + 1;
      }
    });
    return clients.map(c => ({
      name: c.business_name,
      conversations: clientConvos[c.id] || 0,
      leads: clientLeads[c.id] || 0,
      mrr: Number(c.mrr) || 0,
      plan: c.plan,
    })).sort((a, b) => b.conversations - a.conversations);
  })();

  const hotLeads = convos
    .filter(c => c.lead_status === "interessado" || c.lead_status === "marcou_consulta")
    .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());

  const totalConvos = convos.length;
  const converted = convos.filter(c => c.lead_status === "cliente").length;
  const conversionRate = totalConvos > 0 ? Math.round((converted / totalConvos) * 100) : 0;
  const avgMessages = totalConvos > 0 ? Math.round(convos.reduce((s, c) => s + (c.messages_count || 0), 0) / totalConvos) : 0;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "performance", label: "Performance" },
    { key: "leads", label: "Leads" },
    { key: "revenue", label: "Receita" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-6 h-64 animate-pulse"><div className="h-4 bg-muted rounded w-1/3" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Taxa Conversão</p>
              <p className="text-2xl font-display text-foreground mt-1">{conversionRate}%</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Msg/Conversa</p>
              <p className="text-2xl font-display text-foreground mt-1">{avgMessages}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Leads Quentes</p>
              <p className="text-2xl font-display text-green-400 mt-1">{hotLeads.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Conversas</p>
              <p className="text-2xl font-display text-foreground mt-1">{totalConvos}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily conversations */}
            <div className="glass-card p-6">
              <h3 className="text-foreground font-medium text-sm mb-4">Conversas por Dia</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="hsl(240 5% 60%)" fontSize={10} interval={4} />
                    <YAxis stroke="hsl(240 5% 60%)" fontSize={10} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="count" stroke="hsl(262 83% 58%)" fill="url(#colorCount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead distribution */}
            <div className="glass-card p-6">
              <h3 className="text-foreground font-medium text-sm mb-4">Distribuição de Leads</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leadDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {leadDist.map(e => <Cell key={e.key} fill={LEAD_COLORS[e.key] || "#6B7280"} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment */}
            <div className="glass-card p-6">
              <h3 className="text-foreground font-medium text-sm mb-4">Sentimento</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sentimentDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {sentimentDist.map(e => <Cell key={e.name} fill={SENTIMENT_COLORS[e.name] || "#6B7280"} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="glass-card p-6">
              <h3 className="text-foreground font-medium text-sm mb-4">Funil de Conversão</h3>
              <div className="space-y-3 pt-4">
                {funnelData.map((stage, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{stage.name}</span>
                      <span className="text-foreground font-medium">{stage.value}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0}%`,
                          background: stage.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "performance" && (
        <div className="space-y-6">
          {/* Agents */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-foreground font-medium text-sm">Performance dos Agentes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Agente</th>
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Cliente</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Conversas</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Mensagens</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {agentPerformance.map((a, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-foreground font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.client}</td>
                      <td className="px-4 py-3 text-right text-foreground">{a.conversations}</td>
                      <td className="px-4 py-3 text-right text-foreground">{a.messages}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${a.active ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"}`}>
                          {a.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clients */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-foreground font-medium text-sm">Performance dos Clientes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Cliente</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Conversas</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Leads</th>
                    <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">MRR</th>
                    <th className="text-center text-xs text-muted-foreground font-medium px-4 py-3">Plano</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {clientPerformance.map((c, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-foreground font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-right text-foreground">{c.conversations}</td>
                      <td className="px-4 py-3 text-right text-green-400">{c.leads}</td>
                      <td className="px-4 py-3 text-right text-foreground">€{c.mrr}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          c.plan === "pro" ? "bg-purple-900 text-purple-300" :
                          c.plan === "growth" ? "bg-blue-900 text-blue-300" :
                          "bg-gray-800 text-gray-300"
                        }`}>
                          {c.plan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-foreground font-medium text-sm">Leads Quentes ({hotLeads.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Contacto</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Necessidade</th>
                  <th className="text-left text-xs text-muted-foreground font-medium px-4 py-3">Resumo</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-4 py-3">Última msg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {hotLeads.map(c => {
                  const ls = c.lead_status || "novo";
                  return (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium">{c.contact_name || c.contact_phone}</p>
                        <p className="text-muted-foreground text-xs">{c.contact_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${(LEAD_COLORS[ls] ? `bg-[${LEAD_COLORS[ls]}]/20` : "bg-gray-800")} text-foreground`} style={{ background: `${LEAD_COLORS[ls]}33`, color: LEAD_COLORS[ls] }}>
                          {LEAD_LABELS[ls] || ls}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.primary_need || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{c.classification_summary || "—"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString("pt-PT") : "—"}
                      </td>
                    </tr>
                  );
                })}
                {hotLeads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sem leads quentes de momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total MRR</p>
              <p className="text-2xl font-display text-foreground mt-1">€{clients.reduce((s, c) => s + (Number(c.mrr) || 0), 0)}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Clientes Pagantes</p>
              <p className="text-2xl font-display text-foreground mt-1">{clients.filter(c => Number(c.mrr) > 0).length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">MRR Médio</p>
              <p className="text-2xl font-display text-foreground mt-1">
                €{clients.filter(c => Number(c.mrr) > 0).length > 0 ? Math.round(clients.reduce((s, c) => s + (Number(c.mrr) || 0), 0) / clients.filter(c => Number(c.mrr) > 0).length) : 0}
              </p>
            </div>
          </div>

          {/* Revenue by plan */}
          <div className="glass-card p-6">
            <h3 className="text-foreground font-medium text-sm mb-4">Receita por Plano</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  const plans: Record<string, number> = {};
                  clients.forEach(c => { plans[c.plan || "starter"] = (plans[c.plan || "starter"] || 0) + (Number(c.mrr) || 0); });
                  return Object.entries(plans).map(([name, value]) => ({ name, value }));
                })()}>
                  <XAxis dataKey="name" stroke="hsl(240 5% 60%)" fontSize={12} />
                  <YAxis stroke="hsl(240 5% 60%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
