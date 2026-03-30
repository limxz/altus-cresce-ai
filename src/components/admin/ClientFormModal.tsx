import { useState, useEffect } from "react";
import { X, Eye, EyeOff, RefreshCw, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ClientRow } from "@/pages/admin/ClientsManagement";

const NICHES = [
  { value: "restauracao", label: "🍽️ Restauração" },
  { value: "estetica", label: "💆 Saúde e Bem-estar" },
  { value: "ginasio", label: "🏋️ Ginásio" },
  { value: "imobiliaria", label: "🏠 Imobiliária" },
  { value: "dentista", label: "🦷 Dentista" },
  { value: "outros", label: "⚙️ Outros" },
];

const SERVICES = [
  "Gestão Instagram",
  "Gestão Facebook",
  "Meta Ads",
  "Bot WhatsApp IA",
  "Agente de Voz IA",
  "Site profissional",
];

const PLANS = [
  { value: "starter", label: "Starter", price: "€297/mês" },
  { value: "growth", label: "Growth", price: "€497/mês" },
  { value: "pro", label: "Pro", price: "€797/mês" },
];

const MRR_MAP: Record<string, number> = { starter: 297, growth: 497, pro: 797 };

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "Altus@";
  for (let i = 0; i < 6; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw + "!";
};

interface Props {
  client: ClientRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const ClientFormModal = ({ client, onClose, onSaved }: Props) => {
  const isEdit = !!client;
  const { toast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    business_name: client?.business_name || "",
    niche: client?.niche || "outros",
    brand_color: client?.brand_color || "#7C3AED",
    contact_name: client?.contact_name || "",
    contact_phone: client?.contact_phone || "",
    contact_email: client?.contact_email || "",
    login_email: client?.login_email || "",
    login_password: client?.login_password || generatePassword(),
    plan: client?.plan || "starter",
    start_date: client?.start_date || new Date().toISOString().split("T")[0],
    services: (client?.services as string[]) || [],
    instagram_baseline: client?.instagram_baseline || 0,
    facebook_baseline: client?.facebook_baseline || 0,
    leads_baseline: client?.leads_baseline || 0,
    internal_notes: client?.internal_notes || "",
    status: client?.status || "active",
  });

  const update = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));

  const toggleService = (s: string) => {
    const arr = form.services as string[];
    update("services", arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);
  };

  const save = async () => {
    if (!form.business_name || !form.contact_name || !form.login_email || !form.login_password) {
      toast({ title: "Preenche os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      mrr: MRR_MAP[form.plan] || 0,
    };

    if (isEdit && client) {
      await supabase.from("clients" as any).update(payload as any).eq("id", client.id);
      toast({ title: "Cliente atualizado com sucesso!" });
    } else {
      await supabase.from("clients" as any).insert(payload as any);
      toast({ title: "Cliente criado com sucesso!" });
    }
    setSaving(false);
    onSaved();
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-foreground font-display text-lg">
            {isEdit ? "Editar Cliente" : "Novo Cliente"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="space-y-6">
          {/* Business Info */}
          <div>
            <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Informações do Negócio</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome do negócio *</label>
                <input value={form.business_name} onChange={e => update("business_name", e.target.value)} className={inputClass} placeholder="Ex: Restaurante Sabor" />
              </div>
              <div>
                <label className={labelClass}>Nicho *</label>
                <select value={form.niche} onChange={e => update("niche", e.target.value)} className={inputClass}>
                  {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Cor da marca</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.brand_color} onChange={e => update("brand_color", e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                  <input value={form.brand_color} onChange={e => update("brand_color", e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Contacto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome do responsável *</label>
                <input value={form.contact_name} onChange={e => update("contact_name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email do negócio</label>
                <input value={form.contact_email} onChange={e => update("contact_email", e.target.value)} className={inputClass} type="email" />
              </div>
            </div>
          </div>

          {/* Portal Access */}
          <div>
            <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Acesso ao Portal</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email de login *</label>
                <input value={form.login_email} onChange={e => update("login_email", e.target.value)} className={inputClass} type="email" />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.login_password}
                    onChange={e => update("login_password", e.target.value)}
                    className={inputClass + " pr-20"}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground p-1">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" onClick={() => update("login_password", generatePassword())} className="text-muted-foreground hover:text-accent p-1" title="Gerar password">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan */}
          <div>
            <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Plano e Serviços</h4>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {PLANS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update("plan", p.value)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    form.plan === p.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted/50 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs mt-1">{p.price}</div>
                </button>
              ))}
            </div>
            <div>
              <label className={labelClass}>Data de início *</label>
              <input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)} className={inputClass + " max-w-xs"} />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Serviços activos</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {SERVICES.map(s => (
                  <label key={s} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form.services as string[]).includes(s)}
                      onChange={() => toggleService(s)}
                      className="accent-primary"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Métricas Iniciais</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Seguidores IG</label>
                <input type="number" value={form.instagram_baseline} onChange={e => update("instagram_baseline", +e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Seguidores FB</label>
                <input type="number" value={form.facebook_baseline} onChange={e => update("facebook_baseline", +e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Leads/mês</label>
                <input type="number" value={form.leads_baseline} onChange={e => update("leads_baseline", +e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notas internas</label>
            <textarea value={form.internal_notes} onChange={e => update("internal_notes", e.target.value)} rows={3} className={inputClass + " resize-none"} />
          </div>

          {/* Edit-only: Danger Zone */}
          {isEdit && (
            <div className="border border-destructive/30 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-destructive uppercase tracking-widest mb-3">Danger Zone</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { update("status", form.status === "paused" ? "active" : "paused"); }}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {form.status === "paused" ? "Reativar cliente" : "Pausar cliente"}
                </button>
                <button
                  type="button"
                  onClick={() => update("login_password", generatePassword())}
                  className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw size={14} className="inline mr-1" /> Reset password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="btn-outline !px-5 !py-2 !text-sm !rounded-lg">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary !px-5 !py-2 !text-sm !rounded-lg">
            {saving ? "A guardar..." : isEdit ? "Guardar" : "Criar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientFormModal;
