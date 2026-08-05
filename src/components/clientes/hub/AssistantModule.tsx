import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { HubSnapshot, askAssistant } from "@/hooks/useClientHub";
import { Panel, SectionTitle } from "./HubUI";
import { Send, Sparkles } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Como estão os meus resultados esta semana?",
  "Onde estou a perder dinheiro?",
  "Que leads devo contactar primeiro?",
  "O que a Altus fez por mim nos últimos dias?",
];

const AssistantModule = ({
  data, session, onNavigate,
}: { data: HubSnapshot; session: string | null; onNavigate?: (module: string) => void }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: value }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const reply = await askAssistant(data.client.id, session, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Não consegui responder agora. Tenta novamente dentro de momentos." }]);
    }
    setBusy(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Assistente Altus"
        hint="Pergunta o que quiseres sobre o teu negócio — responde apenas com os teus dados reais"
      />

      <Panel className="flex flex-col" style={{ height: "min(70vh, 620px)" }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,.15)" }}>
                <Sparkles size={18} style={{ color: "var(--os-accent)" }} />
              </div>
              <div>
                <p className="text-sm">Olá {data.client.contact_name?.split(" ")[0]}.</p>
                <p className="text-xs os-faint mt-1">Sei tudo o que se passa no {data.client.business_name}.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="os-btn !px-3 text-xs">{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                style={m.role === "user"
                  ? { background: "rgba(124,58,237,.18)", border: "1px solid rgba(124,58,237,.3)" }
                  : { background: "var(--os-panel-2)", border: "1px solid var(--os-line)" }}
              >
                {m.role === "assistant"
                  ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const target = String(href ?? "");
                            if (!target.startsWith("hub:")) {
                              return <span>{children}</span>;
                            }
                            const [module, query] = target.slice(4).split("?");
                            return (
                              <button
                                type="button"
                                onClick={() => onNavigate?.(module)}
                                title={query ? "Abrir no portal" : undefined}
                                className="os-source-link"
                              >
                                {children}
                              </button>
                            );
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )
                  : m.content}
              </div>
            </div>
          ))}
          {busy && <p className="text-xs os-faint">A analisar os teus dados…</p>}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="p-3 border-t flex gap-2"
          style={{ borderColor: "var(--os-line)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreve a tua pergunta…"
            className="flex-1 bg-transparent border rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
            style={{ borderColor: "var(--os-line)" }}
          />
          <button type="submit" disabled={busy || !input.trim()} className="os-btn">
            <Send size={13} /> Enviar
          </button>
        </form>
      </Panel>
    </div>
  );
};

export default AssistantModule;
