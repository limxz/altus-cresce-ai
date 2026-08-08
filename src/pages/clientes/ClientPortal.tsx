import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { HubSnapshot, useClientHub } from "@/hooks/useClientHub";
import { AltusContext, useAltusContext } from "@/hooks/useAltusOS";
import "@/styles/altus-os.css";
import {
  LayoutDashboard, LineChart, Users, Globe, FileText, CalendarDays, Sparkles,
  LifeBuoy, LogOut, RefreshCw, Menu, X, Bell,
} from "lucide-react";
import { Panel } from "@/components/clientes/hub/HubUI";

const NAV = [
  { to: "", label: "Início", icon: LayoutDashboard, end: true },
  { to: "altusos", label: "AltusOS", icon: Sparkles },
  { to: "resultados", label: "Resultados", icon: LineChart },
  { to: "leads", label: "Leads", icon: Users },
  { to: "website", label: "Website", icon: Globe },
  { to: "documentos", label: "Documentos", icon: FileText },
  { to: "reunioes", label: "Reuniões", icon: CalendarDays },
  { to: "alertas", label: "Alertas", icon: Bell },
  { to: "suporte", label: "Suporte", icon: LifeBuoy },
];

export interface PortalOutlet {
  data: HubSnapshot | null;
  briefing: any;
  loading: boolean;
  error: string | null;
  session: string | null;
  context: AltusContext | null;
  contextLoading: boolean;
  reload: () => void;
  go: (path: string) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
}

export const usePortal = () => useOutletContext<PortalOutlet>();

const ClientPortal = () => {
  const { client, session, logout } = useClientAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    data, briefing, loading, refreshing, error, updatedAt, liveAt, reload,
    markNotificationRead, markAllRead,
  } = useClientHub(client?.id, session);

  const { context, loading: contextLoading, reload: reloadContext } = useAltusContext(session, !!client);

  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  if (!client) return null;

  const unread = (data?.notifications ?? []).filter((n: any) => !n.read_at).length;
  const base = "/clientes/dashboard";
  const go = (path: string) => navigate(path ? `${base}/${path}` : base);

  const outlet: PortalOutlet = {
    data, briefing, loading, error, session, context, contextLoading,
    reload: () => { reload(); reloadContext(); },
    go, markNotificationRead, markAllRead,
  };

  const current = NAV.find((n) =>
    n.end ? location.pathname.replace(/\/$/, "") === base : location.pathname.includes(`/${n.to}`),
  ) ?? NAV[0];

  return (
    <div className="altus-os min-h-screen flex">
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-[244px] shrink-0 border-r flex flex-col transition-transform lg:translate-x-0 ${
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
          {NAV.map((n) => (
            <NavLink
              key={n.to || "home"}
              to={n.to ? `${base}/${n.to}` : base}
              end={n.end}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  isActive ? "text-white" : "os-dim hover:text-white"
                }`}
              style={({ isActive }) => (isActive ? { background: "rgba(124,58,237,.16)" } : undefined)}
            >
              <n.icon size={15} /> {n.label}
              {n.to === "alertas" && unread > 0 && (
                <span className="ml-auto text-[10px] font-semibold" style={{ color: "var(--os-accent)" }}>{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-2.5 border-t" style={{ borderColor: "var(--os-line)" }}>
          <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] os-dim">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      {navOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setNavOpen(false)} />}

      <div className="flex-1 min-w-0 os-glow">
        <header className="h-16 px-4 sm:px-7 flex items-center gap-3 border-b sticky top-0 z-30 os-glass"
          style={{ borderColor: "var(--os-line)" }}>
          <button className="lg:hidden os-dim" onClick={() => setNavOpen(true)}><Menu size={18} /></button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-medium tracking-[-0.01em] truncate">{current.label}</h1>
            <p className="text-xs os-faint">
              {refreshing
                ? "A atualizar…"
                : updatedAt
                  ? `${liveAt ? "Em direto · a" : "A"}tualizado às ${updatedAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`
                  : "A carregar…"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => go("alertas")} className="os-btn !px-2.5 text-xs" title={`${unread} alertas por ler`}>
              <Bell size={13} />
              {unread > 0 && <span style={{ color: "var(--os-accent)" }}>{unread}</span>}
            </button>
            <button onClick={outlet.reload} className="os-btn" disabled={refreshing}>
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-7 max-w-[1180px]">
          {error && !data ? (
            <Panel className="p-6">
              <p className="text-sm">Não foi possível carregar os teus dados.</p>
              <p className="text-xs os-faint mt-1">{error}</p>
              <button onClick={outlet.reload} className="os-btn mt-4"><RefreshCw size={13} /> Tentar de novo</button>
            </Panel>
          ) : (
            <Outlet context={outlet} />
          )}
        </main>
      </div>
    </div>
  );
};

export default ClientPortal;
