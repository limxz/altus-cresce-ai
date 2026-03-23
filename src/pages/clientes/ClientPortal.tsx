import { useState } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import ClientDashboardTab from "@/components/clientes/DashboardTab";
import WhatsAppLeadsTab from "@/components/clientes/WhatsAppLeadsTab";
import ClientContentTab from "@/components/clientes/ContentTab";
import ClientGrowthTab from "@/components/clientes/GrowthTab";
import ClientSupportTab from "@/components/clientes/SupportTab";
import ROITab from "@/components/clientes/ROITab";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "leads", label: "Leads" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "crescimento", label: "Crescimento" },
  { key: "suporte", label: "Suporte" },
];

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  growth: "bg-primary/20 text-primary",
  pro: "bg-yellow-500/20 text-yellow-400",
};

const ClientPortal = () => {
  const { client, logout } = useClientAuth();
  const [tab, setTab] = useState("dashboard");

  if (!client) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-primary-foreground"
              style={{ background: client.brand_color || "#7C3AED" }}
            >
              {client.business_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-foreground font-medium text-sm">Olá {client.contact_name}!</div>
              <div className="text-muted-foreground text-xs flex items-center gap-2">
                {client.business_name}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PLAN_COLORS[client.plan]}`}>
                  {client.plan.charAt(0).toUpperCase() + client.plan.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === "dashboard" && <ClientDashboardTab />}
          {tab === "leads" && <WhatsAppLeadsTab />}
          {tab === "conteudo" && <ClientContentTab />}
          {tab === "crescimento" && <ClientGrowthTab />}
          {tab === "suporte" && <ClientSupportTab />}
        </motion.div>
      </main>
    </div>
  );
};

export default ClientPortal;
