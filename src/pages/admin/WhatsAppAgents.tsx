import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, Power, MessageCircle, Send, ChevronDown, ChevronUp, Settings2, TestTube } from "lucide-react";

interface Agent {
  id: string;
  client_id: string;
  agent_name: string;
  business_description: string | null;
  services_info: string | null;
  booking_link: string | null;
  working_hours: string | null;
  phone_number: string | null;
  system_prompt: string | null;
  is_active: boolean;
  twilio_number: string | null;
  total_conversations: number;
  total_messages: number;
  clients?: any;
}

const WhatsAppAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    client_id: "",
    agent_name: "Assistente",
    business_description: "",
    services_info: "",
    booking_link: "",
    working_hours: "Seg-Sex 09h-18h",
    twilio_number: "",
    system_prompt: "",
  });

  const [testMessages, setTestMessages] = useState<{ role: string; content: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [agentsRes, clientsRes] = await Promise.all([
      supabase.from("whatsapp_agents").select("*, clients(business_name, brand_color)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, business_name, brand_color").eq("status", "active"),
    ]);
    if (agentsRes.data) setAgents(agentsRes.data as any);
    if (clientsRes.data) setClients(clientsRes.data as any);
    setLoading(false);
  };

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setForm({
      client_id: agent.client_id,
      agent_name: agent.agent_name,
      business_description: agent.business_description || "",
      services_info: agent.services_info || "",
      booking_link: agent.booking_link || "",
      working_hours: agent.working_hours || "Seg-Sex 09h-18h",
      twilio_number: agent.twilio_number || "",
      system_prompt: agent.system_prompt || "",
    });
    setShowForm(true);
    setShowTest(false);
    setTestMessages([]);
  };

  const openNew = () => {
    setSelectedAgent(null);
    setForm({
      client_id: clients[0]?.id || "",
      agent_name: "Assistente",
      business_description: "",
      services_info: "",
      booking_link: "",
      working_hours: "Seg-Sex 09h-18h",
      twilio_number: "",
      system_prompt: "",
    });
    setShowForm(true);
    setShowTest(false);
    setTestMessages([]);
  };

  const save = async () => {
    if (!form.client_id || !form.agent_name) {
      toast({ title: "Preenche os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (selectedAgent) {
      await supabase.from("whatsapp_agents").update(form as any).eq("id", selectedAgent.id);
      toast({ title: "Agente atualizado!" });
    } else {
      await supabase.from("whatsapp_agents").insert(form as any);
      toast({ title: "Agente criado!" });
    }
    setShowForm(false);
    fetchData();
  };

  const toggleActive = async (agent: Agent) => {
    await supabase.from("whatsapp_agents").update({ is_active: !agent.is_active } as any).eq("id", agent.id);
    toast({ title: agent.is_active ? "Agente desactivado" : "Agente activado!" });
    fetchData();
  };

  const sendTestMessage = async () => {
    if (!testInput.trim() || !selectedAgent) return;
    const userMsg = { role: "user", content: testInput };
    setTestMessages((p) => [...p, userMsg]);
    setTestInput("");
    setTestLoading(true);

    try {
      const resp = await supabase.functions.invoke("whatsapp-multi-agent", {
        body: { agent_id: selectedAgent.id, message: testInput },
      });
      const reply = resp.data?.reply || "Sem resposta";
      setTestMessages((p) => [...p, { role: "bot", content: reply }]);
    } catch {
      setTestMessages((p) => [...p, { role: "bot", content: "Erro ao testar." }]);
    }
    setTestLoading(false);
  };

  const inputClass =
    "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider block mb-1.5";

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/whatsapp-multi-agent`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground font-display text-lg">WhatsApp Agents</h2>
          <p className="text-muted-foreground text-sm">Gere os agentes de IA para cada cliente</p>
        </div>
        <button onClick={openNew} className="btn-primary !px-5 !py-2.5 !text-sm flex items-center gap-2 !rounded-lg">
          <Bot size={16} /> Novo Agente
        </button>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="glass-card p-8 text-center text-muted-foreground">A carregar...</div>
      ) : agents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bot size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-foreground font-medium">Sem agentes configurados</p>
          <p className="text-muted-foreground text-sm mt-1">Cria o primeiro agente para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="glass-card p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-primary-foreground"
                    style={{ background: (agent.clients as any)?.brand_color || "#7C3AED" }}
                  >
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-foreground font-medium text-sm">{agent.agent_name}</p>
                    <p className="text-muted-foreground text-xs">{(agent.clients as any)?.business_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(agent)}
                  className={`p-2 rounded-lg transition-all ${
                    agent.is_active
                      ? "bg-green-500/20 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Power size={16} />
                </button>
              </div>

              <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                <span>{agent.total_conversations} conversas</span>
                <span>{agent.total_messages} mensagens</span>
              </div>

              {agent.twilio_number ? (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{agent.twilio_number}</span>
              ) : (
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">Sem número</span>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(agent)} className="flex-1 btn-outline !py-2 !text-xs !rounded-lg flex items-center justify-center gap-1">
                  <Settings2 size={12} /> Configurar
                </button>
                <button
                  onClick={() => { setSelectedAgent(agent); setShowTest(true); setShowForm(true); setTestMessages([]); }}
                  className="flex-1 btn-outline !py-2 !text-xs !rounded-lg flex items-center justify-center gap-1"
                >
                  <TestTube size={12} /> Testar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config/Test Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground font-display text-lg">
                {selectedAgent ? `Configurar: ${selectedAgent.agent_name}` : "Novo Agente"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>

            {!showTest ? (
              <div className="space-y-5">
                {/* Client select */}
                <div>
                  <label className={labelClass}>Cliente *</label>
                  <select value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))} className={inputClass}>
                    <option value="">Selecionar cliente</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.business_name}</option>
                    ))}
                  </select>
                </div>

                {/* Identity */}
                <div>
                  <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Identidade do Agente</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nome do agente *</label>
                      <input value={form.agent_name} onChange={(e) => setForm((p) => ({ ...p, agent_name: e.target.value }))} className={inputClass} placeholder='Ex: "Sofia"' />
                    </div>
                    <div>
                      <label className={labelClass}>Link de marcação</label>
                      <input value={form.booking_link} onChange={(e) => setForm((p) => ({ ...p, booking_link: e.target.value }))} className={inputClass} placeholder="https://cal.com/..." />
                    </div>
                    <div>
                      <label className={labelClass}>Horário</label>
                      <input value={form.working_hours} onChange={(e) => setForm((p) => ({ ...p, working_hours: e.target.value }))} className={inputClass} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={labelClass}>Descrição do negócio</label>
                  <textarea value={form.business_description} onChange={(e) => setForm((p) => ({ ...p, business_description: e.target.value }))} rows={3} className={inputClass + " resize-none"} placeholder="O que é o negócio do cliente..." />
                </div>

                {/* Services */}
                <div>
                  <label className={labelClass}>Serviços e informações</label>
                  <textarea value={form.services_info} onChange={(e) => setForm((p) => ({ ...p, services_info: e.target.value }))} rows={4} className={inputClass + " resize-none"} placeholder={"Serviço 1: desde €X\nServiço 2: desde €Y\n..."} />
                </div>

                {/* Twilio */}
                <div>
                  <h4 className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Configuração Twilio</h4>
                  <div>
                    <label className={labelClass}>Número Twilio</label>
                    <input value={form.twilio_number} onChange={(e) => setForm((p) => ({ ...p, twilio_number: e.target.value }))} className={inputClass} placeholder="+351XXXXXXXXX" />
                  </div>
                  <details className="mt-3">
                    <summary className="text-xs text-accent cursor-pointer hover:underline">Como configurar o Twilio</summary>
                    <div className="mt-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground space-y-1">
                      <p>1. Em twilio.com → Messaging → WhatsApp Sandbox</p>
                      <p>2. Em "When a message comes in" cola:</p>
                      <p className="font-mono text-accent break-all">{webhookUrl}</p>
                      <p>3. Copia o número do sandbox e cola no campo acima</p>
                    </div>
                  </details>
                </div>

                {/* Custom prompt */}
                <div>
                  <label className={labelClass}>Instruções adicionais (opcional)</label>
                  <textarea value={form.system_prompt} onChange={(e) => setForm((p) => ({ ...p, system_prompt: e.target.value }))} rows={3} className={inputClass + " resize-none"} placeholder="Regras extra para o agente..." />
                </div>

                {/* Preview prompt */}
                <div>
                  <button onClick={() => setShowPrompt(!showPrompt)} className="flex items-center gap-1 text-xs text-accent hover:underline">
                    {showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Preview do system prompt
                  </button>
                  {showPrompt && (
                    <pre className="mt-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {`És o ${form.agent_name}, assistente virtual...\n\n${form.business_description}\n\nSERVIÇOS:\n${form.services_info}\n\nHORÁRIO: ${form.working_hours}\n${form.booking_link ? `MARCAÇÕES: ${form.booking_link}` : ""}\n\n${form.system_prompt}`}
                    </pre>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button onClick={() => setShowForm(false)} className="btn-outline !px-5 !py-2 !text-sm !rounded-lg">Cancelar</button>
                  <button onClick={() => { setShowTest(true); setTestMessages([]); }} className="btn-outline !px-5 !py-2 !text-sm !rounded-lg flex items-center gap-2">
                    <TestTube size={14} /> Testar
                  </button>
                  <button onClick={save} className="btn-primary !px-5 !py-2 !text-sm !rounded-lg">Guardar</button>
                </div>
              </div>
            ) : (
              /* Test Chat */
              <div className="flex flex-col h-[60vh]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-primary" />
                    <span className="text-sm text-foreground font-medium">Testar {selectedAgent?.agent_name || form.agent_name}</span>
                  </div>
                  <button onClick={() => setShowTest(false)} className="text-xs text-accent hover:underline">← Voltar à config</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {testMessages.length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-8">Escreve uma mensagem para testar o agente</p>
                  )}
                  {testMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.role === "bot"
                          ? "bg-[#3D1B8C] text-foreground rounded-tl-none"
                          : "bg-[#1A1730] text-foreground rounded-tr-none"
                      }`}>
                        {m.role === "bot" && <span className="text-[10px] text-accent block mb-1">🤖 {selectedAgent?.agent_name || "Bot"}</span>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {testLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[#3D1B8C] px-4 py-3 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
                    className={inputClass}
                    placeholder="Escreve uma mensagem de teste..."
                    disabled={testLoading}
                  />
                  <button onClick={sendTestMessage} disabled={testLoading || !testInput.trim()} className="btn-primary !px-4 !py-2.5 !rounded-lg">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppAgents;
