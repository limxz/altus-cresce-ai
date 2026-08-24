import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, createContext, useContext } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAltusData, OsData } from "@/hooks/useAltusData";
import NotificationCenter from "./os/NotificationCenter";
import AltusChat from "./os/AltusChat";
import "@/styles/altus-os.css";
import {
  Home, Users, Kanban, BrainCircuit, Globe, Megaphone, LineChart,
  Workflow, MessagesSquare, Plug, ScrollText, Settings, LogOut, Menu, X, Sparkles, RefreshCw, Brain,
} from "lucide-react";

const nav = [
  { label: "Home", path: "/admin", icon: Home },
  { label: "Clientes", path: "/admin/clients", icon: Users },
  { label: "Pipeline", path: "/admin/pipeline", icon: Kanban },
  { label: "IA", path: "/admin/ia", icon: BrainCircuit },
  { label: "Memória", path: "/admin/memoria", icon: Brain },
  { label: "Anotações", path: "/admin/notas", icon: NotebookPen },
  { label: "Integrações", path: "/admin/integracoes", icon: Plug },
  { label: "Websites", path: "/admin/websites", icon: Globe },
  { label: "Meta Ads", path: "/admin/meta-ads", icon: Megaphone },
  { label: "Analytics", path: "/admin/analytics", icon: LineChart },
  { label: "Automação", path: "/admin/automacao", icon: Workflow },
  { label: "Auditoria", path: "/admin/auditoria", icon: ScrollText },
  { label: "Conversas", path: "/admin/conversations", icon: MessagesSquare },
  { label: "Configurações", path: "/admin/settings", icon: Settings },
];

const OsContext = createContext<OsData | null>(null);
export const useOs = () => {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOs must be used inside AdminLayout");
  return ctx;
};

const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const os = useAltusData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  const current = nav.find((n) => isActive(n.path))?.label ?? "Altus Intelligence";

  const sidebar = (
    <div className="flex flex-col h-full px-4 py-5">
      <div className="flex items-center gap-2.5 px-2 mb-7">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(150deg,#8b5cf6,#5b21b6)", boxShadow: "0 4px 18px -6px rgba(124,58,237,.9)" }}
        >
          <Sparkles size={13} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-medium tracking-tight">Altus Intelligence</p>
          <p className="text-[10px] os-faint">Centro operacional</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto os-scroll">
        {nav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className="os-nav"
            data-active={isActive(item.path)}
          >
            <item.icon size={15} strokeWidth={1.7} />
            {item.label}
          </Link>
        ))}
      </nav>

      <button onClick={logout} className="os-nav mt-3">
        <LogOut size={15} strokeWidth={1.7} />
        Sair
      </button>
    </div>
  );

  return (
    <OsContext.Provider value={os}>
      <div className="altus-os min-h-screen flex">
        <aside
          className="hidden lg:block w-[228px] fixed inset-y-0 left-0 z-30"
          style={{ background: "#0b0b0d", borderRight: "1px solid var(--os-line)" }}
        >
          {sidebar}
        </aside>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[240px] os-glass">
              <button onClick={() => setMobileOpen(false)} className="os-btn !h-8 !w-8 !p-0 justify-center absolute right-3 top-4">
                <X size={14} />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex-1 lg:ml-[228px] min-w-0">
          <header
            className="h-[56px] flex items-center gap-3 px-5 sticky top-0 z-40 os-glass"
            style={{ borderBottom: "1px solid var(--os-line)", borderTop: 0, borderLeft: 0, borderRight: 0 }}
          >
            <button onClick={() => setMobileOpen(true)} className="lg:hidden os-btn !h-8 !w-8 !p-0 justify-center">
              <Menu size={15} />
            </button>
            <span className="text-[13px] font-medium">{current}</span>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={os.refresh} className="os-btn !h-8 !w-8 !p-0 justify-center" title="Atualizar dados">
                <RefreshCw size={13} className={os.loading ? "animate-spin" : ""} />
              </button>
              <NotificationCenter items={os.notifications} />
              <button onClick={() => setChatOpen(true)} className="os-btn os-btn-accent">
                <Sparkles size={13} />
                <span className="hidden sm:inline">Perguntar</span>
              </button>
            </div>
          </header>

          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 lg:px-8 py-7 max-w-[1320px]"
          >
            <Outlet />
          </motion.main>
        </div>

        <AltusChat open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </OsContext.Provider>
  );
};

export default AdminLayout;
