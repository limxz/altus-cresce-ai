import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Search, X, Eye, Phone, Clock, Tag } from "lucide-react";

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
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string | null;
}

const WhatsAppLeadsTab = () => {
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hotNewIds, setHotNewIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) return;
    fetchConversations();

    // Realtime subscription
    const channel = supabase
      .channel("wa-convos-" + client.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_conversations", filter: `client_id=eq.${client.id}` }, (payload) => {
        const convo = payload.new as Conversation;
        fetchConversations();
        // Notificação de hot lead
        if (convo.lead_status === "interessado" || convo.urgency === "urgente") {
          const name = convo.contact_name || convo.contact_phone;
          const need = convo.primary_need ? ` — ${convo.primary_need}` : "";
          toast({
            title: "🔥 Novo lead quente!",
            description: `${name}${need}`,
            duration: 8000,
            variant: "destructive",
          });
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.4;
          audio.play().catch(() => {});
          setHotNewIds((prev) => new Set([...prev, convo.id]));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "whatsapp_conversations", filter: `client_id=eq.${client.id}` }, (payload) => {
        const convo = payload.new as Conversation;
        fetchConversations();
        // Notificação se passou a hot lead por UPDATE
        if (convo.lead_status === "interessado" || convo.urgency === "urgente") {
          const name = convo.contact_name || convo.contact_phone;
          const need = convo.primary_need ? ` — ${convo.primary_need}` : "";
          toast({
            title: "🔥 Novo lead quente!",
            description: `${name}${need}`,
            duration: 8000,
            variant: "destructive",
          });
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.4;
          audio.play().catch(() => {});
          setHotNewIds((prev) => new Set([...prev, convo.id]));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "whatsapp_conversations", filter: `client_id=eq.${client.id}` }, () => fetchConversations())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `client_id=eq.${client.id}` }, (payload) => {
        if (selected && (payload.new as any).conversation_id === selected.id) {
          setMessages((p) => [...p, payload.new as Message]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [client]);

  const fetchConversations = async () => {
    if (!client) return;
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("client_id", client.id)
      .order("last_message_at", { ascending: false });
    if (data) setConversations(data as any);
    setLoading(false);
  };

  const openConvo = async (convo: Conversation) => {
    setSelected(convo);
    // Mark as read
    if (!convo.is_read) {
      await supabase.from("whatsapp_conversations").update({ is_read: true } as any).eq("id", convo.id);
      setConversations((p) => p.map((c) => (c.id === convo.id ? { ...c, is_read: true } : c)));
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
    setConversations((p) => p.map((c) => (c.id === id ? { ...c, lead_status } : c)));
    if (selected?.id === id) setSelected((p) => (p ? { ...p, lead_status } : p));
  };

  const filtered = conversations.filter((c) => {
    if (statusFilter !== "all" && c.lead_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (c.contact_name || "").toLowerCase().includes(q) ||
        c.contact_phone.includes(q) ||
        (c.last_message || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: conversations.length,
    hot: conversations.filter((c) => c.lead_status === "interessado" || c.lead_status === "marcou_consulta").length,
    today: conversations.filter((c) => c.started_at && new Date(c.started_at).toDateString() === new Date().toDateString()).length,
    unread: conversations.filter((c) => !c.is_read).length,
  };

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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total conversas</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.hot}</p>
          <p className="text-xs text-muted-foreground">Leads quentes</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-accent">{stats.today}</p>
          <p className="text-xs text-muted-foreground">Hoje</p>
        </div>
        <div className="glass-card p-4 text-center relative">
          <p className="text-2xl font-bold text-foreground">{stats.unread}</p>
          <p className="text-xs text-muted-foreground">Não lidas</p>
          {stats.unread > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome ou mensagem..." className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ k: "all", l: "Todos" }, { k: "novo", l: "Novo" }, { k: "interessado", l: "Interessado" }, { k: "marcou_consulta", l: "Marcou consulta" }, { k: "cliente", l: "Cliente" }, { k: "perdido", l: "Perdido" }].map((f) => (
            <button
              key={f.k}
              onClick={() => setStatusFilter(f.k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === f.k ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">Ainda não há conversas.</p>
            <p className="text-muted-foreground text-sm mt-1">Quando um cliente enviar mensagem aparece aqui.</p>
          </div>
        ) : (
          filtered.map((c) => {
            const ls = LEAD_STATUS_MAP[c.lead_status] || LEAD_STATUS_MAP.novo;
            const urg = URGENCY_MAP[c.urgency] || URGENCY_MAP.normal;
            const isHotNew = hotNewIds.has(c.id);
            return (
              <button key={c.id} onClick={() => { openConvo(c); setHotNewIds((prev) => { const next = new Set(prev); next.delete(c.id); return next; }); }} className={`w-full glass-card p-4 text-left hover:border-primary/30 transition-all ${isHotNew ? "border-red-500/60 ring-1 ring-red-500/30" : ""}`}>
                <div className="flex items-start gap-3">
                  {isHotNew && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1.5 animate-pulse" />}
                  {!isHotNew && !c.is_read && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-foreground text-sm font-medium">{c.contact_name || c.contact_phone}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${ls.color}`}>{ls.label}</span>
                      {urg.label && <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${urg.color}`}>{urg.label}</span>}
                    </div>
                    {c.classification_summary && <p className="text-muted-foreground text-xs mb-1">💡 {c.classification_summary}</p>}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {(c.tags || []).slice(0, 3).map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-purple-800/30 text-purple-300 border border-purple-700">{t}</span>
                      ))}
                    </div>
                    <p className="text-muted-foreground text-xs truncate">{c.last_message}</p>
                    <span className="text-muted-foreground text-[10px]">{timeAgo(c.last_message_at)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Conversation Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg h-full flex flex-col border-l border-primary/10">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-foreground font-medium">{selected.contact_name || selected.contact_phone}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={10} /> {selected.contact_phone}
                    <span>•</span>
                    <Clock size={10} /> {selected.started_at ? new Date(selected.started_at).toLocaleDateString("pt-PT") : "—"}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
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
                <div className="flex gap-1 flex-wrap">
                  {selected.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-purple-800/30 text-purple-300 border border-purple-700"><Tag size={8} className="inline mr-1" />{t}</span>
                  ))}
                </div>
              )}

              {/* AI Summary */}
              {selected.classification_summary && (
                <div className="mt-2 p-3 bg-primary/10 rounded-lg">
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
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "bot" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.sender === "bot" ? "bg-[#3D1B8C] text-foreground rounded-tl-none" : "bg-[#1A1730] text-foreground rounded-tr-none"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppLeadsTab;
