import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Panel, Label, Skeleton, EmptyHint } from "@/components/admin/os/Primitives";
import { Brain, Save, RefreshCw } from "lucide-react";

interface ClientRow { id: string; business_name: string; niche: string | null; organization_id: string }

interface Memory {
  client_id: string;
  organization_id: string;
  goals: string;
  niche: string;
  city: string;
  competitors: string[];
  kpis: string[];
  tone: string;
  audience: string;
  offers: string;
  history: string;
}

const empty = (c: ClientRow): Memory => ({
  client_id: c.id,
  organization_id: c.organization_id,
  goals: "", niche: c.niche ?? "", city: "", competitors: [], kpis: [],
  tone: "", audience: "", offers: "", history: "",
});

const Field = ({
  label, hint, value, onChange, rows = 3,
}: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number }) => (
  <div className="space-y-1.5">
    <span className="os-label">{label}</span>
    {hint && <p className="text-[11px] os-faint">{hint}</p>}
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-[13px] bg-transparent outline-none resize-y"
      style={{ border: "1px solid var(--os-line)", background: "rgba(255,255,255,.02)" }}
    />
  </div>
);

const ClientMemory = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("clients").select("id, business_name, niche, organization_id")
        .eq("status", "active").order("business_name");
      const list = (data ?? []) as ClientRow[];
      setClients(list);
      setSelected(list[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const loadMemory = useCallback(async (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const { data } = await supabase.from("client_memory").select("*").eq("client_id", clientId).maybeSingle();
    setMemory(
      data
        ? {
            client_id: clientId,
            organization_id: client.organization_id,
            goals: data.goals ?? "", niche: data.niche ?? client.niche ?? "", city: data.city ?? "",
            competitors: (data.competitors as string[]) ?? [], kpis: (data.kpis as string[]) ?? [],
            tone: data.tone ?? "", audience: data.audience ?? "", offers: data.offers ?? "", history: data.history ?? "",
          }
        : empty(client),
    );
  }, [clients]);

  useEffect(() => { if (selected) loadMemory(selected); }, [selected, loadMemory]);

  const save = async () => {
    if (!memory) return;
    setSaving(true);
    const { error } = await supabase.from("client_memory").upsert(memory as any, { onConflict: "client_id" });
    setSaving(false);
    if (error) toast({ title: "Não foi possível guardar", description: error.message, variant: "destructive" });
    else toast({ title: "Memória guardada", description: "A IA passa a usar este contexto em todas as análises." });
  };

  const set = (k: keyof Memory) => (v: string) => setMemory((m) => (m ? { ...m, [k]: v } : m));
  const setList = (k: "competitors" | "kpis") => (v: string) =>
    setMemory((m) => (m ? { ...m, [k]: v.split(",").map((s) => s.trim()).filter(Boolean) } : m));

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[22px] font-medium tracking-[-0.02em]">Memória do cliente</h1>
        <p className="os-dim text-[14px] mt-1">
          Contexto permanente que alimenta os agentes IA — escreves uma vez, é usado em todos os relatórios.
        </p>
      </header>

      {loading ? (
        <Skeleton className="h-[300px] !rounded-2xl" />
      ) : clients.length === 0 ? (
        <Panel className="p-2"><EmptyHint title="Sem clientes ativos" hint="Cria um cliente para começar a construir a memória." /></Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            <Label>Clientes</Label>
            <div className="space-y-1.5">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-2.5"
                  style={{
                    background: selected === c.id ? "rgba(255,255,255,.06)" : "transparent",
                    border: "1px solid var(--os-line)",
                  }}
                >
                  <Brain size={13} className={selected === c.id ? "" : "os-faint"} />
                  <span className="text-[13px] truncate">{c.business_name}</span>
                </button>
              ))}
            </div>
          </div>

          {memory && (
            <Panel className="p-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Objetivos" hint="O que este cliente quer alcançar nos próximos meses." value={memory.goals} onChange={set("goals")} />
                <Field label="Histórico" hint="O que já foi feito, o que funcionou e o que falhou." value={memory.history} onChange={set("history")} />
                <Field label="Nicho" rows={2} value={memory.niche} onChange={set("niche")} />
                <Field label="Cidade" rows={2} value={memory.city} onChange={set("city")} />
                <Field label="Concorrentes" hint="Separados por vírgula." rows={2} value={memory.competitors.join(", ")} onChange={setList("competitors")} />
                <Field label="KPIs" hint="Separados por vírgula (ex.: leads/mês, CPL, seguidores)." rows={2} value={memory.kpis.join(", ")} onChange={setList("kpis")} />
                <Field label="Público-alvo" value={memory.audience} onChange={set("audience")} />
                <Field label="Serviços e ofertas" value={memory.offers} onChange={set("offers")} />
                <Field label="Tom de comunicação" hint="Como a marca fala com os clientes." value={memory.tone} onChange={set("tone")} />
              </div>
              <div className="flex justify-end">
                <button onClick={save} disabled={saving} className="os-btn">
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Guardar memória
                </button>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientMemory;
