import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Inbox,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Presentation,
  Stethoscope,
  Bot,
  BookOpen,
  BarChart3,
  Kanban,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Leads", path: "/admin/leads", icon: Inbox },
  { label: "Conversas", path: "/admin/conversations", icon: MessageCircle },
  { label: "Clientes", path: "/admin/clients", icon: Users },
  { label: "WhatsApp Agents", path: "/admin/whatsapp", icon: Bot },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Pipeline", path: "/admin/pipeline", icon: Kanban },
  { label: "Preços", path: "/admin/pricing", icon: DollarSign },
  { label: "Diagnósticos", path: "/admin/diagnosticos", icon: Stethoscope },
  { label: "Apresentações", path: "/admin/presentations", icon: Presentation },
  { label: "Setup", path: "/admin/setup", icon: BookOpen },
  { label: "Configurações", path: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-6 mb-2" style={{ borderBottom: "1px solid rgba(42,32,64,0.5)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] uppercase text-foreground font-bold">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-sm transition-all duration-150 ${
              isActive(item.path)
                ? "text-accent font-semibold"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
            style={isActive(item.path) ? {
              background: "rgba(139,92,246,0.12)",
              borderLeft: "2px solid hsl(var(--primary))",
              paddingLeft: "12px",
            } : {
              borderLeft: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <item.icon size={16} className={isActive(item.path) ? "text-primary" : ""} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid rgba(42,32,64,0.5)" }}>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-sm text-muted-foreground hover:text-foreground transition-all duration-150 w-full font-medium"
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[256px] fixed inset-y-0 left-0" style={{ background: "hsl(var(--sidebar-background))", borderRight: "1px solid rgba(42,32,64,0.8)" }}>
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[256px]" style={{ background: "hsl(var(--sidebar-background))", borderRight: "1px solid rgba(42,32,64,0.8)" }}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[256px]">
        <header className="h-[60px] flex items-center px-6 sticky top-0 z-40" style={{ background: "hsl(var(--background))", borderBottom: "1px solid rgba(42,32,64,0.6)", backdropFilter: "blur(10px)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground mr-4 transition-colors duration-200"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-display text-base text-foreground" style={{ fontWeight: 600 }}>
            {navItems.find((i) => isActive(i.path))?.label || "Dashboard"}
          </h1>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
