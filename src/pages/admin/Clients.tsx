import { useState } from "react";
import { useAdminData, Client } from "@/contexts/AdminDataContext";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const emptyClient: Omit<Client, "id"> = {
  name: "", business: "", email: "", phone: "", package: "Starter",
  startDate: new Date().toISOString().split("T")[0], notes: "", status: "ativo",
};

const Clients = () => {
  const { clients, setClients } = useAdminData();
  const [editing, setEditing] = useState<Client | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setEditing({ id: crypto.randomUUID(), ...emptyClient });
    setIsNew(true);
  };

  const openEdit = (c: Client) => {
    setEditing({ ...c });
    setIsNew(false);
  };

  const save = () => {
    if (!editing) return;
    if (isNew) {
      setClients((prev) => [...prev, editing]);
    } else {
      setClients((prev) => prev.map((c) => (c.id === editing.id ? editing : c)));
    }
    setEditing(null);
  };

  const remove = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={openNew} className="btn-primary !px-5 !py-2 !text-sm flex items-center gap-2">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Negócio</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Pacote</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-foreground">{c.name}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{c.business}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">{c.package}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "ativo" ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-accent mr-2"><Edit2 size={14} /></button>
                    <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground font-medium">{isNew ? "Novo Cliente" : "Editar Cliente"}</h3>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {(["name", "business", "email", "phone"] as const).map((field) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                    {field === "name" ? "Nome" : field === "business" ? "Negócio" : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    value={editing[field]}
                    onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                    className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Pacote</label>
                <select
                  value={editing.package}
                  onChange={(e) => setEditing({ ...editing, package: e.target.value })}
                  className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none"
                >
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Pro</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Estado</label>
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as "ativo" | "inativo" })}
                  className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Notas</label>
                <textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-muted border border-primary/10 rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="btn-outline !px-5 !py-2 !text-sm">Cancelar</button>
              <button onClick={save} className="btn-primary !px-5 !py-2 !text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
