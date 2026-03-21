import { useState } from "react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Check, X, Plus, Pencil, Trash2, Save, XCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  subtitle: string;
  popular: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
}

interface Service {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: string;
}

const defaultPlans: Plan[] = [
  {
    id: "1",
    name: "Starter",
    price: "€197",
    subtitle: "Para começar a crescer",
    popular: false,
    features: [
      { text: "Gestão Instagram + Facebook", included: true },
      { text: "12 posts por mês criados com IA", included: true },
      { text: "Legendas e hashtags otimizadas", included: true },
      { text: "Relatório mensal de resultados", included: true },
      { text: "Suporte por WhatsApp", included: true },
      { text: "Facebook & Instagram Ads", included: false },
      { text: "Agente WhatsApp IA", included: false },
      { text: "Site profissional", included: false },
    ],
    cta: "Começar Agora",
  },
  {
    id: "2",
    name: "Growth",
    price: "€297",
    subtitle: "Para negócios que querem escalar",
    popular: true,
    features: [
      { text: "Tudo do Starter", included: true },
      { text: "20 posts por mês + Stories diários", included: true },
      { text: "Facebook & Instagram Ads (budget até €500)", included: true },
      { text: "Relatório semanal com métricas", included: true },
      { text: "Agente WhatsApp IA Basic", included: true },
      { text: "Suporte prioritário 24/7", included: true },
      { text: "Site profissional", included: false },
      { text: "Agente de Voz IA", included: false },
    ],
    cta: "Começar Agora",
  },
  {
    id: "3",
    name: "Pro",
    price: "€419",
    subtitle: "Solução completa com IA",
    popular: false,
    features: [
      { text: "Tudo do Growth", included: true },
      { text: "Posts diários + Reels + Stories", included: true },
      { text: "Ads ilimitados + Retargeting + Funil completo", included: true },
      { text: "Agente WhatsApp IA Pro (qualifica leads 24/7)", included: true },
      { text: "Agente de Voz IA (atende chamadas automaticamente)", included: true },
      { text: "Site profissional incluído (valor €897)", included: true },
      { text: "Reunião estratégica mensal", included: true },
      { text: "Account manager dedicado", included: true },
    ],
    cta: "Falar com a Equipa",
  },
];

const defaultServices: Service[] = [
  { id: "1", icon: "📱", title: "Gestão de Redes Sociais", description: "Posts criados com IA para Instagram e Facebook", price: "A partir de €150/mês" },
  { id: "2", icon: "📢", title: "Facebook & Instagram Ads", description: "Campanhas que chegam aos clientes certos", price: "A partir de €197/mês" },
  { id: "3", icon: "🌐", title: "Site Profissional", description: "Site moderno, rápido e otimizado para converter", price: "A partir de €89/mês" },
  { id: "4", icon: "🤖", title: "Agente WhatsApp IA", description: "Responde clientes e qualifica leads 24/7", price: "€297 setup + €77/mês" },
  { id: "5", icon: "🎙️", title: "Agente de Voz IA", description: "Atende chamadas automaticamente com voz natural", price: "€397 setup + €97/mês" },
  { id: "6", icon: "📦", title: "Bundle Personalizado", description: "Combinamos serviços para o teu negócio específico", price: "Preço personalizado" },
];

const AdminPricing = () => {
  const [plans, setPlans] = useState<Plan[]>(() => {
    try {
      const stored = localStorage.getItem("altus_admin_plans");
      return stored ? JSON.parse(stored) : defaultPlans;
    } catch {
      return defaultPlans;
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const stored = localStorage.getItem("altus_admin_services");
      return stored ? JSON.parse(stored) : defaultServices;
    } catch {
      return defaultServices;
    }
  });

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const savePlans = (updated: Plan[]) => {
    setPlans(updated);
    localStorage.setItem("altus_admin_plans", JSON.stringify(updated));
  };

  const saveServices = (updated: Service[]) => {
    setServices(updated);
    localStorage.setItem("altus_admin_services", JSON.stringify(updated));
  };

  const savePlan = () => {
    if (!editingPlan) return;
    const exists = plans.find((p) => p.id === editingPlan.id);
    if (exists) {
      savePlans(plans.map((p) => (p.id === editingPlan.id ? editingPlan : p)));
    } else {
      savePlans([...plans, editingPlan]);
    }
    setEditingPlan(null);
  };

  const saveService = () => {
    if (!editingService) return;
    const exists = services.find((s) => s.id === editingService.id);
    if (exists) {
      saveServices(services.map((s) => (s.id === editingService.id ? editingService : s)));
    } else {
      saveServices([...services, editingService]);
    }
    setEditingService(null);
  };

  return (
    <div className="space-y-8">
      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-foreground">Planos</h2>
          <button
            onClick={() =>
              setEditingPlan({
                id: crypto.randomUUID(),
                name: "",
                price: "",
                subtitle: "",
                popular: false,
                features: [],
                cta: "Começar Agora",
              })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors"
          >
            <Plus size={16} /> Novo Plano
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card rounded-xl p-6 border ${plan.popular ? "border-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.15)]" : "border-primary/10"}`}
            >
              {plan.popular && (
                <span className="inline-block bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-sans font-semibold px-3 py-1 rounded-full mb-3">
                  Mais Popular
                </span>
              )}
              <h3 className="font-display text-lg text-foreground">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-2">{plan.subtitle}</p>
              <p className="font-display text-3xl text-foreground mb-4">
                {plan.price}<span className="text-sm text-muted-foreground">/mês</span>
              </p>
              <ul className="space-y-1.5 mb-4 text-sm">
                {plan.features.map((f, i) => (
                  <li key={i} className={`flex items-center gap-2 ${f.included ? "text-foreground" : "text-muted-foreground/40"}`}>
                    {f.included ? <Check size={14} className="text-primary" /> : <X size={14} />}
                    {f.text}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button onClick={() => setEditingPlan({ ...plan })} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/80">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => savePlans(plans.filter((p) => p.id !== plan.id))} className="px-3 py-2 rounded-lg bg-destructive/20 text-destructive text-sm hover:bg-destructive/30">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-foreground">Serviços Individuais</h2>
          <button
            onClick={() =>
              setEditingService({
                id: crypto.randomUUID(),
                icon: "📦",
                title: "",
                description: "",
                price: "",
              })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors"
          >
            <Plus size={16} /> Novo Serviço
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="bg-card rounded-xl p-5 border border-primary/10 border-l-[3px] border-l-primary">
              <span className="text-2xl mb-2 block">{s.icon}</span>
              <h4 className="font-display text-base text-foreground mb-1">{s.title}</h4>
              <p className="text-muted-foreground text-sm mb-2">{s.description}</p>
              <p className="font-display text-foreground text-sm mb-3">{s.price}</p>
              <div className="flex gap-2">
                <button onClick={() => setEditingService({ ...s })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs hover:bg-muted/80">
                  <Pencil size={12} /> Editar
                </button>
                <button onClick={() => saveServices(services.filter((x) => x.id !== s.id))} className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs hover:bg-destructive/30">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-primary/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-display text-lg text-foreground">Editar Plano</h3>
            <input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Nome" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <input value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })} placeholder="Preço (ex: €297)" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <input value={editingPlan.subtitle} onChange={(e) => setEditingPlan({ ...editingPlan, subtitle: e.target.value })} placeholder="Subtítulo" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={editingPlan.popular} onChange={(e) => setEditingPlan({ ...editingPlan, popular: e.target.checked })} />
              Mais Popular
            </label>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Features (uma por linha, prefixo ✓ ou ✗)</p>
              <textarea
                value={editingPlan.features.map((f) => `${f.included ? "✓" : "✗"} ${f.text}`).join("\n")}
                onChange={(e) => {
                  const features = e.target.value.split("\n").map((line) => {
                    const included = line.startsWith("✓");
                    const text = line.replace(/^[✓✗]\s*/, "");
                    return { text, included };
                  });
                  setEditingPlan({ ...editingPlan, features });
                }}
                rows={8}
                className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingPlan(null)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted text-foreground text-sm">
                <XCircle size={14} /> Cancelar
              </button>
              <button onClick={savePlan} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-primary/20 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-display text-lg text-foreground">Editar Serviço</h3>
            <input value={editingService.icon} onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })} placeholder="Ícone (emoji)" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <input value={editingService.title} onChange={(e) => setEditingService({ ...editingService, title: e.target.value })} placeholder="Título" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <input value={editingService.description} onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} placeholder="Descrição" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <input value={editingService.price} onChange={(e) => setEditingService({ ...editingService, price: e.target.value })} placeholder="Preço" className="w-full bg-muted border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingService(null)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-muted text-foreground text-sm">
                <XCircle size={14} /> Cancelar
              </button>
              <button onClick={saveService} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
                <Save size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPricing;
