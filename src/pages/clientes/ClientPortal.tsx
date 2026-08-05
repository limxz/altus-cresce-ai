import { useState } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useClientHub } from "@/hooks/useClientHub";
import "@/styles/altus-os.css";
import {
  LayoutDashboard, LineChart, Users, Globe, FileText, CalendarDays, Sparkles,
  LifeBuoy, LogOut, RefreshCw, Menu, X, Bell,
} from "lucide-react";
import { Panel, Skeleton } from "@/components/admin/os/Primitives";
import OverviewModule from "@/components/clientes/hub/OverviewModule";
import ResultsModule from "@/components/clientes/hub/ResultsModule";
import LeadsModule from "@/components/clientes/hub/LeadsModule";
import WebsiteModule from "@/components/clientes/hub/WebsiteModule";
import DocumentsModule from "@/components/clientes/hub/DocumentsModule";
import MeetingsModule from "@/components/clientes/hub/MeetingsModule";
import AssistantModule from "@/components/clientes/hub/AssistantModule";
import ClientSupportTab from "@/components/clientes/SupportTab";

const MODULES = [
  { key: "inicio", label: "Início", icon: LayoutDashboard },
  { key: "resultados", label: "Resultados", icon: LineChart },
  { key: "leads", label: "Leads", icon: Users },
  { key: "website", label: "Website", icon: Globe },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "reunioes", label: "Reuniões", icon: CalendarDays },
  { key: "assistente", label: "Assistente IA", icon: Sparkles },
  { key: "suporte", label: "Suporte", icon: LifeBuoy },
];

const ClientPortal = () => {
  const { client, logout } = useClientAuth();
  const [module, setModule] = useState("inicio");
  const [navOpen, setNavOpen] = useState(false);
  const { data, briefing, loading, refreshing, error, updatedAt, reload } = useClientHub(client?.id);

  if (!client) return null;

  const unread = (data?.notifications ?? []).filter((n: any) => !n.read_at).length;
  const active = MODULES.find((m) => m.key === module)!;

  const go = (key: string) => { setModule(key); setNavOpen(false); };

  return (
    <div className="altus-os min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-[248px] shrink-0 border-r flex flex-col transition-transform lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ borderColor: "var(--os-line)", background: "var(--os-panel)" }}
      >
        <div className="h-16 px-4 flex items-center gap-3 border-b" style={{ borderColor: "var(--os-line)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold"
            style={{ background: client.brand_color || "var(--os-accent)" }}>
            {client.business_name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate">{client.business_name}</p>
            <p className="text-xs os-faint capitalize">Plano {client.plan}</p>
          </div>
          <button className="lg:hidden ml-auto os-faint" onClick={() => setNavOpen(false)}><X size={16} /></button>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {MODULES.map((m) => (
            <button
              key={m.key}
              onClick={() => go(m.key)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors"
              style={module === m.key
                ? { background: "rgba(124,58,237,.16)", color: "#fff" }
                : { color: "var(--os-dim)" }}
            >
              <m.icon size={15} /> {m.label}
            </button>
          ))}
        </nav>

        <div className="p-2.5 border-t" style={{ borderColor: "var(--os-line)" }}>
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] os-dim">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      {navOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 os-glow">
        <header className="h-16 px-4 sm:px-7 flex items-center gap-3 border-b sticky top-0 z-30 os-glass"
          style={{ borderColor: "var(--os-line)" }}>
          <button className="lg:hidden os-dim" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-medium tracking-[-0.01em] truncate">{active.label}</h1>
            <p className="text-xs os-faint">
              {refreshing ? "A atualizar…" : updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}` : "A carregar…"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {unread > 0 && (
              <span className="os-btn !px-2.5 text-xs" title={`${unread} alertas`}>
                <Bell size={13} /> {unread}
              </span>
            )}
            <button onClick={reload} className="os-btn" disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-7 max-w-[1180px]">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[110px] !rounded-2xl" />)}
              </div>
              <Skeleton className="h-[220px] !rounded-2xl" />
            </div>
          ) : error || !data ? (
            <Panel className="p-6">
              <p className="text-sm">Não foi possível carregar os teus dados.</p>
              <p className="text-xs os-faint mt-1">{error}</p>
              <button onClick={reload} className="os-btn mt-4"><RefreshCw size={13} /> Tentar de novo</button>
            </Panel>
          ) : (
            <>
              {module === "inicio" && <OverviewModule data={data} briefing={briefing} onNavigate={go} />}
              {module === "resultados" && <ResultsModule data={data} />}
              {module === "leads" && <LeadsModule data={data} />}
              {module === "website" && <WebsiteModule data={data} />}
              {module === "documentos" && <DocumentsModule data={data} />}
              {module === "reunioes" && <MeetingsModule data={data} />}
              {module === "assistente" && <AssistantModule data={data} />}
              {module === "suporte" && <ClientSupportTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientPortal;
