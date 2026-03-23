import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Edit2, MoreHorizontal, Pause, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ClientFormModal from "@/components/admin/ClientFormModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NICHE_MAP: Record<string, string> = {
  restauracao: "🍽️ Restaurante",
  estetica: "💆 Estética",
  ginasio: "🏋️ Ginásio",
  imobiliaria: "🏠 Imobiliária",
  dentista: "🦷 Dentista",
  outros: "⚙️ Outros",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-muted text-muted-foreground",
  growth: "bg-primary/20 text-primary",
  pro: "bg-yellow-500/20 text-yellow-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  trial: "bg-blue-500/20 text-blue-400",
  paused: "bg-muted text-muted-foreground",
};

export interface ClientRow {
  id: string;
  business_name: string;
  niche: string;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  login_email: string;
  login_password: string;
  plan: string;
  status: string;
  logo_url: string | null;
  brand_color: string | null;
  services: any;
  start_date: string | null;
  mrr: number | null;
  instagram_baseline: number | null;
  facebook_baseline: number | null;
  leads_baseline: number | null;
  internal_notes: string | null;
  created_at: string | null;
}

const ClientsManagement = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients" as any).select("*").order("created_at", { ascending: false });
    if (!error && data) setClients(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = useMemo(() => {
    let list = clients;
    if (filter !== "all") list = list.filter(c => c.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.business_name.toLowerCase().includes(q) ||
        NICHE_MAP[c.niche]?.toLowerCase().includes(q) ||
        c.contact_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, filter, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("clients" as any).delete().eq("id", deleteId);
    setClients(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Cliente eliminado" });
  };

  const handlePause = async (id: string, current: string) => {
    const newStatus = current === "paused" ? "active" : "paused";
    await supabase.from("clients" as any).update({ status: newStatus } as any).eq("id", id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    toast({ title: newStatus === "paused" ? "Cliente pausado" : "Cliente reativado" });
  };

  const filters = [
    { label: "Todos", value: "all" },
    { label: "Activo", value: "active" },
    { label: "Trial", value: "trial" },
    { label: "Pausado", value: "paused" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar clientes..."
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="btn-primary !px-5 !py-2.5 !text-sm flex items-center gap-2 !rounded-lg"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Nicho</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Plano</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden xl:table-cell">MRR</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Início</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">A carregar...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Nenhum cliente encontrado</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground"
                          style={{ background: c.brand_color || "#7C3AED" }}
                        >
                          {c.business_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-foreground font-medium">{c.business_name}</div>
                          <div className="text-muted-foreground text-xs">{c.contact_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {NICHE_MAP[c.niche] || c.niche}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PLAN_COLORS[c.plan] || PLAN_COLORS.starter}`}>
                        {c.plan.charAt(0).toUpperCase() + c.plan.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || STATUS_COLORS.active}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell text-foreground font-medium">
                      €{c.mrr || 0}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {c.start_date ? new Date(c.start_date).toLocaleDateString("pt-PT") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => window.open(`/clientes/dashboard?admin=true&cid=${c.id}`, "_blank")}
                          className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                          title="Portal"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => { setEditing(c); setModalOpen(true); }}
                          className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                              <MoreHorizontal size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePause(c.id, c.status)}>
                              <Pause size={14} className="mr-2" />
                              {c.status === "paused" ? "Reativar" : "Pausar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(c.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <ClientFormModal
          client={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={() => { setModalOpen(false); setEditing(null); fetchClients(); }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados do cliente serão eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsManagement;
