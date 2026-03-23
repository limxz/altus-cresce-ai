import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Phone, Globe, X } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  hot: { label: "🟢 Quente", color: "bg-green-500/20 text-green-400", dot: "bg-green-400" },
  warm: { label: "🟡 Em análise", color: "bg-yellow-500/20 text-yellow-400", dot: "bg-yellow-400" },
  cold: { label: "🔴 Sem interesse", color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
};

const BOT_ICONS: Record<string, any> = {
  whatsapp: MessageCircle,
  voice: Phone,
  chat: Globe,
};

const LeadsTab = () => {
  const { client } = useClientAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!client) return;
    supabase.from("client_conversations" as any).select("*").eq("client_id", client.id)
      .order("last_message_at", { ascending: false })
      .then(({ data }) => { if (data) setConversations(data as any[]); });
  }, [client]);

  const openConvo = async (convo: any) => {
    setSelected(convo);
    const { data } = await supabase.from("client_messages" as any).select("*")
      .eq("conversation_id", convo.id).order("created_at", { ascending: true });
    if (data) setMessages(data as any[]);
  };

  const updateStatus = async (convoId: string, status: string) => {
    await supabase.from("client_conversations" as any).update({ status } as any).eq("id", convoId);
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, status } : c));
    if (selected?.id === convoId) setSelected((p: any) => ({ ...p, status }));
  };

  const stats = {
    total: conversations.length,
    hot: conversations.filter(c => c.status === "hot").length,
    warm: conversations.filter(c => c.status === "warm").length,
    cold: conversations.filter(c => c.status === "cold").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1.5 rounded-lg bg-muted text-foreground">Total: {stats.total}</span>
        <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400">Quentes: {stats.hot}</span>
        <span className="px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">Em análise: {stats.warm}</span>
        <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400">Sem interesse: {stats.cold}</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {conversations.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground text-sm">Sem conversas registadas</div>
        ) : (
          conversations.map(c => {
            const Icon = BOT_ICONS[c.bot_type] || MessageCircle;
            const st = STATUS_LABELS[c.status] || STATUS_LABELS.warm;
            return (
              <button
                key={c.id}
                onClick={() => openConvo(c)}
                className="w-full glass-card p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-all"
              >
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">{c.contact_name || "Contacto anónimo"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary flex items-center gap-1">
                      <Icon size={10} /> {c.bot_type}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5 truncate">
                    {c.last_message_at ? new Date(c.last_message_at).toLocaleString("pt-PT") : "—"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Conversation Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="glass-card p-6 w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-foreground font-medium">{selected.contact_name || "Contacto"}</h3>
                <div className="flex gap-2 mt-1">
                  {(["hot", "warm", "cold"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`px-2 py-0.5 rounded text-xs transition-all ${
                        selected.status === s ? STATUS_LABELS[s].color : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABELS[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Sem mensagens</p>
              ) : (
                messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === "bot" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.sender === "bot"
                        ? "bg-primary/20 text-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      {m.sender === "bot" && (
                        <span className="text-[10px] text-accent block mb-1">Altus AI 🤖</span>
                      )}
                      {m.content}
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {new Date(m.created_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
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

export default LeadsTab;
