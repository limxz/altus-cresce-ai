import { useAdminData } from "@/contexts/AdminDataContext";
import { Users, Inbox, MessageCircle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { day: "Sem 1", leads: 2 },
  { day: "Sem 2", leads: 5 },
  { day: "Sem 3", leads: 3 },
  { day: "Sem 4", leads: 8 },
];

const Dashboard = () => {
  const { leads, conversations, clients } = useAdminData();
  const newLeads = leads.filter((l) => l.status === "novo").length;

  const kpis = [
    { label: "Total Clientes", value: clients.length, icon: Users },
    { label: "Leads Este Mês", value: leads.length, icon: Inbox },
    { label: "Conversas Chat", value: conversations.length, icon: MessageCircle },
    { label: "Taxa Conversão", value: `${leads.length > 0 ? Math.round((leads.filter(l => l.status === "fechado").length / leads.length) * 100) : 0}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-xs uppercase tracking-widest">
                {kpi.label}
              </span>
              <kpi.icon size={18} className="text-accent" />
            </div>
            <div className="font-display text-3xl text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-foreground font-medium mb-4 text-sm">Leads — Últimas 4 semanas</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" stroke="hsl(240 5% 60%)" fontSize={12} />
              <YAxis stroke="hsl(240 5% 60%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(248 32% 9%)",
                  border: "1px solid hsl(262 83% 58% / 0.2)",
                  borderRadius: "8px",
                  color: "hsl(240 5% 95%)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="hsl(262 83% 58%)"
                strokeWidth={2}
                dot={{ fill: "hsl(270 95% 75%)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {newLeads > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-foreground font-medium mb-3 text-sm">Atividade Recente</h3>
          <div className="space-y-3">
            {leads
              .filter((l) => l.status === "novo")
              .slice(0, 5)
              .map((lead) => (
                <div key={lead.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-foreground">{lead.name}</span>
                  <span className="text-muted-foreground">— {lead.business}</span>
                  <span className="ml-auto text-muted-foreground text-xs">{lead.date}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
