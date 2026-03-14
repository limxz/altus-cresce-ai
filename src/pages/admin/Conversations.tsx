import { useState } from "react";
import { useAdminData } from "@/contexts/AdminDataContext";

const Conversations = () => {
  const { conversations } = useAdminData();
  const [selected, setSelected] = useState<string | null>(null);

  const activeConvo = conversations.find((c) => c.id === selected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[60vh]">
      {/* List */}
      <div className="glass-card overflow-hidden lg:col-span-1">
        <div className="p-4 border-b border-primary/10">
          <h3 className="text-foreground font-medium text-sm">Conversas ({conversations.length})</h3>
        </div>
        <div className="divide-y divide-primary/5">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors ${
                selected === c.id ? "bg-primary/10" : ""
              }`}
            >
              <p className="text-foreground text-sm font-medium">{c.visitorName}</p>
              <p className="text-muted-foreground text-xs">{c.date} · {c.messages.length} mensagens</p>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="p-4 text-muted-foreground text-sm">Sem conversas.</p>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="glass-card lg:col-span-2 flex flex-col">
        {activeConvo ? (
          <>
            <div className="p-4 border-b border-primary/10">
              <h3 className="text-foreground font-medium text-sm">{activeConvo.visitorName}</h3>
              <p className="text-muted-foreground text-xs">{activeConvo.date}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConvo.messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground/90 rounded-bl-md"
                    }`}
                  >
                    <p>{m.content}</p>
                    <p className="text-[10px] opacity-60 mt-1">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Seleciona uma conversa para ver os detalhes.
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
