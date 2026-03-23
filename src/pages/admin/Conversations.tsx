import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Search, X, Phone, Clock, Tag, Eye } from "lucide-react";

const LEAD_STATUS_MAP: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-gray-800 text-gray-300" },
  interessado: { label: "Interessado", color: "bg-blue-900 text-blue-300" },
  marcou_consulta: { label: "Marcou consulta", color: "bg-green-900 text-green-300" },
  cliente: { label: "Cliente", color: "bg-purple-900 text-purple-300" },
  perdido: { label: "Perdido", color: "bg-red-900 text-red-300" },
};

const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  urgente: { label: "🔴 Urgente", color: "bg-red-500 text-white animate-pulse" },
  normal: { label: "", color: "" },
  baixa: { label: "Baixa", color: "bg-gray-800 text-gray-400" },
};

interface Conversation {
  id: string;
  client_id: string;
  contact_phone: string;
  contact_name: string | null;
  first_message: string | null;
  last_message: string | null;
  last_message_at: string | null;
  started_at: string | null;
  lead_status: string;
  urgency: string;
  primary_need: string | null;
  sentiment: string | null;
  tags: string[];
  classification_summary: string | null;
  is_read: boolean;
  messages_count: number;
  client_name?: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string | null;
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel("admin-wa-convos")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_conversations" }, () => fetchConversations())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_messages" }, (payload) => {
        if (selected && (payload.new as any).conversation_id === selected.id) {
          setMessages(p => [...p, payload.new as Message]);
        }
        toast({ title: "Nova mensagem recebida 🔔" });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConversations = async () => {
    // Fetch conversations with client names
    const { data: convos } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    // Fetch client names
    const clientIds = [...new Set(convos.map(c => c.client_id))];
    const { data: clients } = await supabase
      .from("clients")
      .select("id, business_name")
      .in("id", clientIds.length > 0 ? clientIds : ["__none__"]);

    const clientMap: Record<string, string> = {};
    (clients || []).forEach(c => { clientMap[c.id] = c.business_name; });

    setConversations(convos.map(c => ({
      ...c,
      lead_status: c.lead_status || "novo",
      urgency: c.urgency || "normal",
      tags: c.tags || [],
      is_read: c.is_read ?? true,
      messages_count: c.messages_count || 0,
      client_name: clientMap[c.client_id] || "—",
    })) as Conversation[]);

    setLoading(false);
  };

  const openConvo = async (convo: Conversation) => {
    setSelected(convo);
    if (!convo.is_read) {
      await supabase.from("whatsapp_conversations").update({ is_read: true } as any).eq("id", convo.id);
      setConversations(p => p.map(c => c.id === convo.id ? { ...c, is_read: true } : c));
    }
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("timestamp", { ascending: true });
    if (data) setMessages(data as any);
  };

  const updateLeadStatus = async (id: string, lead_status: string) => {
    await supabase.from("whatsapp_conversations").update({ lead_status } as any).eq("id", id);
    setConversations(p => p.map(c => c.id === id ? { ...c, lead_status } : c));
    if (selected?.id === id) setSelected(p => p ? { ...p, lead_status } : p);
  };

  const filtered = conversations.filter(c => {
    if (statusFilter !== "all" && c.lead_status !== statusFilter) return false;
    if (urgencyFilter !== "all" && c.urgency !== urgencyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.contact_name || "").toLowerCase().includes(q) ||
        c.contact_phone.includes(q) ||
        (c.last_message || "").toLowerCase().includes(q) ||
        (c.client_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const timeAgo = (date: string | null) => {
    if (!date) return "";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `há ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    return `há ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-[75vh]">
      {/* Left Panel - List */}
      <div className="lg:col-span-2 border-r border-border flex flex-col glass-card overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[{ k: "all", l: "Todos" }, { k: "novo", l: "Novo" }, { k: "interessado", l: "Interessado" }, { k: "marcou_consulta", l: "Marcou" }, { k: "cliente", l: "Cliente" }, { k: "perdido", l: "Perdido" }].map(f => (
              <button
                key={f.k}
                onClick={() => setStatusFilter(f.k)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${statusFilter === f.k ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {f.l}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {[{ k: "all", l: "Todas" }, { k: "urgente", l: "🔴 Urgente" }, { k: "normal", l: "Normal" }, { k: "baixa", l: "Baixa" }].map(f => (
              <button
                key={f.k}
                onClick={() => setUrgencyFilter(f.k)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${urgencyFilter === f.k ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/50">
          {loading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle size={36} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground text-sm font-medium">Sem conversas</p>
              <p className="text-muted-foreground text-xs mt-1">Quando clientes enviarem mensagens aparecem aqui.</p>
            </div>
          ) : (
            filtered.map(c => {
              const ls = LEAD_STATUS_MAP[c.lead_status] || LEAD_STATUS_MAP.novo;
              const urg = URGENCY_MAP[c.urgency] || URGENCY_MAP.normal;
              return (
                <button
                  key={c.id}
                  onClick={() => openConvo(c)}
                  className={`w-full text-left p-4 hover:bg-muted/30 transition-all ${selected?.id === c.id ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    {!c.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-foreground text-sm font-medium">{c.contact_name || c.contact_phone}</span>
                        <span className="text-muted-foreground text-[10px]">• {c.client_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ls.color}`}>{ls.label}</span>
                        {urg.label && <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${urg.color}`}>{urg.label}</span>}
                        {(c.tags || []).slice(0, 2).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] bg-purple-800/30 text-purple-300 border border-purple-700">{t}</span>
                        ))}
                      </div>
                      {c.classification_summary && <p className="text-muted-foreground text-[11px] mb-0.5 truncate">💡 {c.classification_summary}</p>}
                      <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-xs truncate pr-2">{c.last_message}</p>
                        <span className="text-muted-foreground text-[10px] shrink-0">{timeAgo(c.last_message_at)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="lg:col-span-3 flex flex-col glass-card overflow-hidden">
        {selected ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-foreground font-medium">{selected.contact_name || selected.contact_phone}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={10} /> {selected.contact_phone}
                    <span>•</span>
                    <span>{selected.client_name}</span>
                    <span>•</span>
                    <Clock size={10} /> {selected.started_at ? new Date(selected.started_at).toLocaleDateString("pt-PT") : "—"}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="lg:hidden text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>

              {/* Status selector */}
              <div className="flex gap-1.5 flex-wrap mb-2">
                {Object.entries(LEAD_STATUS_MAP).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => updateLeadStatus(selected.id, k)}
                    className={`px-2.5 py-1 rounded text-xs transition-all ${selected.lead_status === k ? v.color : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Tags */}
              {(selected.tags || []).length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                  {selected.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-purple-800/30 text-purple-300 border border-purple-700">
                      <Tag size={8} className="inline mr-1" />{t}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Summary */}
              {selected.classification_summary && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs text-primary">💡 Resumo IA: {selected.classification_summary}</p>
                  {selected.primary_need && <p className="text-xs text-muted-foreground mt-1">Necessidade: {selected.primary_need}</p>}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Sem mensagens</p>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === "bot" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.sender === "bot"
                        ? "bg-[#3D1B8C] text-foreground rounded-tl-none"
                        : "bg-[#1A1730] text-foreground rounded-tr-none"
                    }`}>
                      {m.sender === "bot" && <span className="text-[10px] text-accent block mb-1">🤖 Bot</span>}
                      {m.content}
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">Seleciona uma conversa</p>
              <p className="text-muted-foreground text-sm mt-1">Escolhe uma conversa à esquerda para ver os detalhes.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
