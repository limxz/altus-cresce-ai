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
      <div className="p-6 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">A</span>
          </div>
          <span className="font-display text-sm tracking-[0.15em] uppercase text-foreground">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
              isActive(item.path)
                ? "bg-primary/15 text-accent"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-primary/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all w-full"
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
      <aside className="hidden lg:block w-64 bg-card border-r border-primary/10 fixed inset-y-0 left-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-primary/10">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="h-16 border-b border-primary/10 flex items-center px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground mr-4"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-display text-lg text-foreground">
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
