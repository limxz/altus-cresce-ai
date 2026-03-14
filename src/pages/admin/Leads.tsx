import { useState } from "react";
import { useAdminData, Lead } from "@/contexts/AdminDataContext";
import { Download } from "lucide-react";

const statusColors = {
  novo: "bg-accent/20 text-accent",
  contactado: "bg-secondary/20 text-secondary",
  fechado: "bg-green-500/20 text-green-400",
};

const Leads = () => {
  const { leads, setLeads } = useAdminData();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const updateStatus = (id: string, status: Lead["status"]) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const exportCSV = () => {
    const header = "Nome,Email,Telefone,Negócio,Data,Estado\n";
    const rows = leads.map((l) => `${l.name},${l.email},${l.phone},${l.business},${l.date},${l.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads_altus.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {["all", "novo", "contactado", "fechado"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? "bg-primary/20 text-accent" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Negócio</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-foreground">{lead.name}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{lead.email}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden lg:table-cell">{lead.business}</td>
                  <td className="px-5 py-3 text-muted-foreground">{lead.date}</td>
                  <td className="px-5 py-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value as Lead["status"])}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium bg-transparent border-none focus:outline-none cursor-pointer ${statusColors[lead.status]}`}
                    >
                      <option value="novo">Novo</option>
                      <option value="contactado">Contactado</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leads;
