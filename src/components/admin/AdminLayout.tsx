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
      <div className="p-6 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] uppercase text-foreground font-bold">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm transition-all duration-200 ${
              isActive(item.path)
                ? "bg-[rgba(139,92,246,0.12)] text-[#A78BFA] border-l-2 border-l-[#8B5CF6] font-semibold"
                : "text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.04)] hover:text-white font-medium"
            }`}
          >
            <item.icon size={18} className={isActive(item.path) ? "text-[#8B5CF6]" : ""} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[rgba(255,255,255,0.04)]">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm text-[#9CA3AF] hover:bg-[rgba(255,255,255,0.04)] hover:text-white transition-all duration-200 w-full font-medium"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[248px] fixed inset-y-0 left-0 border-r border-[rgba(255,255,255,0.04)]" style={{ background: "#09090F" }}>
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[248px] border-r border-[rgba(255,255,255,0.04)]" style={{ background: "#09090F" }}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-[248px]">
        <header className="h-[60px] border-b border-[rgba(255,255,255,0.04)] flex items-center px-6 sticky top-0 z-40 backdrop-blur-[10px]" style={{ background: "#09090F" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#9CA3AF] hover:text-white mr-4 transition-colors duration-200"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-display text-lg text-foreground font-bold">
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
