import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MoreVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PipelineLead {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  plan_value: number;
  stage: string;
  score: number;
  notes: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
}

const STAGES = [
  { key: "novo", label: "Lead Novo" },
  { key: "reuniao", label: "Reunião Marcada" },
  { key: "proposta", label: "Proposta Enviada" },
  { key: "fechado", label: "Fechado ✅" },
  { key: "perdido", label: "Perdido ❌" },
];

const PLAN_OPTIONS = [
  { value: 297, label: "Starter €297" },
  { value: 497, label: "Growth €497" },
  { value: 797, label: "Pro €797" },
];

const Pipeline = () => {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<Partial<PipelineLead>>({});
  const [dragItem, setDragItem] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLeads = async () => {
    const { data } = await supabase.from("pipeline_leads" as any).select("*").order("created_at", { ascending: false });
    setLeads((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const saveNewLead = async () => {
    if (!editLead.business_name) return;
    if (editLead.id) {
      await supabase.from("pipeline_leads" as any).update({
        business_name: editLead.business_name, contact_name: editLead.contact_name,
        phone: editLead.phone, email: editLead.email, plan_value: editLead.plan_value || 297,
        notes: editLead.notes, next_action: editLead.next_action, score: editLead.score || 50,
      }).eq("id", editLead.id);
    } else {
      await supabase.from("pipeline_leads" as any).insert({
        business_name: editLead.business_name, contact_name: editLead.contact_name,
        phone: editLead.phone, email: editLead.email, plan_value: editLead.plan_value || 297,
        notes: editLead.notes, next_action: editLead.next_action, stage: "novo", score: editLead.score || 50,
      });
    }
    setShowModal(false);
    setEditLead({});
    fetchLeads();
    toast({ title: editLead.id ? "Lead atualizado" : "Lead criado com sucesso!" });
  };

  const moveToStage = async (leadId: string, newStage: string) => {
    await supabase.from("pipeline_leads" as any).update({ stage: newStage, updated_at: new Date().toISOString() }).eq("id", leadId);
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    await supabase.from("pipeline_leads" as any).delete().eq("id", id);
    fetchLeads();
  };

  const handleDragStart = (id: string) => setDragItem(id);
  const handleDrop = (stage: string) => {
    if (dragItem) { moveToStage(dragItem, stage); setDragItem(null); }
  };

  const stageLeads = (stage: string) => leads.filter(l => l.stage === stage);
  const stageTotal = (stage: string) => stageLeads(stage).reduce((s, l) => s + (Number(l.plan_value) || 0), 0);

  const totalPipeline = leads.filter(l => l.stage !== "perdido").reduce((s, l) => s + (Number(l.plan_value) || 0), 0);
  const closed = leads.filter(l => l.stage === "fechado");
  const convRate = leads.length > 0 ? Math.round((closed.length / leads.length) * 100) : 0;

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

  const scoreBadge = (score: number) =>
    score >= 80 ? "bg-green-500/20 text-green-400" :
    score >= 50 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400";

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="glass-card p-6 animate-pulse h-24" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Taxa Conversão", value: `${convRate}%` },
          { label: "Pipeline Total", value: `€${totalPipeline}` },
          { label: "MRR Estimado", value: `€${closed.reduce((s, l) => s + (Number(l.plan_value) || 0), 0)}` },
          { label: "Leads Activos", value: leads.filter(l => !["fechado", "perdido"].includes(l.stage)).length },
        ].map((m, i) => (
          <div key={i} className="glass-card p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">{m.label}</p>
            <p className="font-display text-xl text-foreground mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button onClick={() => { setEditLead({}); setShowModal(true); }} className="btn-primary flex items-center gap-2 !text-sm">
        <Plus size={16} /> Novo Lead
      </button>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <div
            key={stage.key}
            className="min-w-[240px] flex-1 rounded-xl bg-muted/30 p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(stage.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground text-sm font-medium">{stage.label}</h3>
              <span className="text-muted-foreground text-xs">{stageLeads(stage.key).length} · €{stageTotal(stage.key)}</span>
            </div>

            <div className="space-y-3">
              {stageLeads(stage.key).map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  className="glass-card p-4 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-foreground text-sm font-medium truncate">{lead.business_name}</p>
                    <div className="relative group">
                      <button className="text-muted-foreground hover:text-foreground"><MoreVertical size={14} /></button>
                      <div className="hidden group-hover:block absolute right-0 top-6 bg-card border border-border rounded-lg shadow-xl z-10 w-32">
                        <button onClick={() => { setEditLead(lead); setShowModal(true); }} className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground">Editar</button>
                        <button onClick={() => deleteLead(lead.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-red-400">Eliminar</button>
                      </div>
                    </div>
                  </div>
                  {lead.contact_name && <p className="text-muted-foreground text-xs mb-2">{lead.contact_name}</p>}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary">€{lead.plan_value}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${scoreBadge(lead.score)}`}>{lead.score}pts</span>
                  </div>
                  {daysSince(lead.updated_at) > 5 && (
                    <p className="text-red-400 text-[10px]">⚠ {daysSince(lead.updated_at)} dias sem movimento</p>
                  )}
                  {lead.next_action && <p className="text-muted-foreground text-[10px] italic mt-1">{lead.next_action}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-foreground font-medium mb-4">{editLead.id ? "Editar Lead" : "Novo Lead"}</h3>
            <div className="space-y-3">
              <input value={editLead.business_name || ""} onChange={e => setEditLead(l => ({ ...l, business_name: e.target.value }))}
                placeholder="Nome do negócio *" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground" />
              <input value={editLead.contact_name || ""} onChange={e => setEditLead(l => ({ ...l, contact_name: e.target.value }))}
                placeholder="Nome do contacto" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <input value={editLead.phone || ""} onChange={e => setEditLead(l => ({ ...l, phone: e.target.value }))}
                  placeholder="Telefone" className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground" />
                <input value={editLead.email || ""} onChange={e => setEditLead(l => ({ ...l, email: e.target.value }))}
                  placeholder="Email" className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground" />
              </div>
              <select value={editLead.plan_value || 297} onChange={e => setEditLead(l => ({ ...l, plan_value: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm">
                {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input type="number" value={editLead.score || 50} onChange={e => setEditLead(l => ({ ...l, score: Number(e.target.value) }))}
                placeholder="Score (0-100)" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm" />
              <input value={editLead.next_action || ""} onChange={e => setEditLead(l => ({ ...l, next_action: e.target.value }))}
                placeholder="Próxima acção" className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground" />
              <textarea value={editLead.notes || ""} onChange={e => setEditLead(l => ({ ...l, notes: e.target.value }))}
                placeholder="Notas" rows={2} className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground">Cancelar</button>
              <button onClick={saveNewLead} className="flex-1 btn-primary !text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
