import { useState, useEffect } from "react";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Instagram, Facebook, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContentTab = () => {
  const { client } = useClientAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [subTab, setSubTab] = useState("pending");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!client) return;
    supabase.from("content_posts" as any).select("*").eq("client_id", client.id)
      .order("scheduled_at", { ascending: true })
      .then(({ data }) => { if (data) setPosts(data as any[]); });
  }, [client]);

  const filtered = posts.filter(p => {
    if (subTab === "pending") return p.status === "pending";
    if (subTab === "scheduled") return p.status === "approved";
    return p.status === "published";
  });

  const pendingCount = posts.filter(p => p.status === "pending").length;

  const approve = async (id: string) => {
    await supabase.from("content_posts" as any).update({ status: "approved" } as any).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "approved" } : p));
    toast({ title: "Post aprovado!" });
  };

  const reject = async (id: string) => {
    const fb = feedback[id] || "";
    await supabase.from("content_posts" as any).update({ status: "rejected", client_feedback: fb } as any).eq("id", id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "rejected", client_feedback: fb } : p));
    toast({ title: "Feedback enviado à equipa" });
  };

  const tabs = [
    { key: "pending", label: `Pendente${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { key: "scheduled", label: "Agendado" },
    { key: "published", label: "Publicado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              subTab === t.key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground text-sm">
          Nenhum post {subTab === "pending" ? "pendente" : subTab === "scheduled" ? "agendado" : "publicado"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="glass-card overflow-hidden">
              {/* Image */}
              <div className="h-48 bg-primary/5 flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Instagram size={32} className="text-primary/30" />
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {(p.platform === "instagram" || p.platform === "both") && <Instagram size={14} className="text-accent" />}
                  {(p.platform === "facebook" || p.platform === "both") && <Facebook size={14} className="text-accent" />}
                  <span className="text-muted-foreground text-xs">
                    {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString("pt-PT") : "Sem data"}
                  </span>
                </div>
                <p className="text-foreground text-sm">{p.caption || "Sem legenda"}</p>
                {p.hashtags && (
                  <div className="flex flex-wrap gap-1">
                    {p.hashtags.split(" ").map((h: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{h}</span>
                    ))}
                  </div>
                )}

                {subTab === "pending" && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex gap-2">
                      <button onClick={() => approve(p.id)} className="flex-1 btn-primary !py-2 !text-xs !rounded-lg flex items-center justify-center gap-1">
                        <Check size={14} /> Aprovar
                      </button>
                      <button onClick={() => reject(p.id)} className="flex-1 btn-outline !py-2 !text-xs !rounded-lg flex items-center justify-center gap-1">
                        <X size={14} /> Pedir alteração
                      </button>
                    </div>
                    <textarea
                      placeholder="Feedback (opcional)..."
                      value={feedback[p.id] || ""}
                      onChange={e => setFeedback(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:border-primary/40"
                      rows={2}
                    />
                  </div>
                )}

                {subTab === "scheduled" && p.scheduled_at && (
                  <div className="flex items-center gap-1 text-xs text-accent">
                    <Clock size={12} />
                    Publica {getCountdown(p.scheduled_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getCountdown(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "em breve";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `em ${days}d ${hours}h`;
  return `em ${hours}h`;
}

export default ContentTab;
