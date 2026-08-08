import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Plus, Send, Sparkles, Trash2, Pencil, Search, MessageSquare, AlertTriangle } from "lucide-react";
import { usePortal } from "../ClientPortal";
import { Panel } from "@/components/clientes/hub/HubUI";
import SourcesRow from "@/components/clientes/hub/SourcesRow";
import { useAltusChat, useAltusConversations } from "@/hooks/useAltusOS";

const SUGGESTIONS = [
  "Como estão as minhas campanhas?",
  "Porque é que os leads desceram?",
  "Em que me devo focar esta semana?",
  "Compara este mês com o mês passado.",
  "Onde estamos a perder clientes?",
  "O que farias com os próximos 2.000 €?",
  "O que fez a equipa Altus esta semana?",
];

const AltusOSView = () => {
  const { session, context, go } = usePortal();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const { conversations, create, rename, remove, reload } = useAltusConversations(session);
  const { messages, status, thinking, error, send } = useAltusChat(session, conversationId ?? null);

  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const prefill = params.get("q");

  useEffect(() => { inputRef.current?.focus(); }, [conversationId]);
  useEffect(() => { if (status === "idle") inputRef.current?.focus(); }, [status]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  useEffect(() => {
    if (!prefill) return;
    setParams({}, { replace: true });
    submit(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const onCreated = (id: string, title: string) => {
    if (id !== conversationId) navigate(`/clientes/dashboard/altusos/${id}`, { replace: true });
    reload();
    void title;
  };

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || status !== "idle") return;
    setInput("");
    send(value, onCreated);
  };

  const newConversation = async () => {
    const conv = await create();
    if (conv) navigate(`/clientes/dashboard/altusos/${conv.id}`);
  };

  const visible = conversations.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-[24px] leading-tight font-medium tracking-[-0.03em]">AltusOS</h2>
        <p className="text-sm os-dim">O sistema operativo de inteligência do teu negócio.</p>
      </header>

      <div className="grid lg:grid-cols-[248px_1fr] gap-4 items-start">
        <Panel className="p-2.5 hidden lg:block">
          <button onClick={newConversation} className="os-btn w-full justify-center mb-2.5">
            <Plus size={13} /> Nova conversa
          </button>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 os-faint" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Procurar…"
              className="w-full bg-transparent border rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none"
              style={{ borderColor: "var(--os-line)" }}
            />
          </div>
          <div className="space-y-0.5 max-h-[420px] overflow-y-auto">
            {visible.length === 0 && <p className="text-xs os-faint px-2 py-3">Ainda sem conversas.</p>}
            {visible.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] transition-colors"
                style={c.id === conversationId ? { background: "rgba(124,58,237,.16)" } : undefined}
              >
                <button
                  onClick={() => navigate(`/clientes/dashboard/altusos/${c.id}`)}
                  className="flex-1 min-w-0 text-left truncate"
                >
                  <MessageSquare size={11} className="inline mr-1.5 os-faint" />
                  {c.title}
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 os-faint"
                  title="Renomear"
                  onClick={() => {
                    const next = window.prompt("Novo nome da conversa", c.title);
                    if (next?.trim()) rename(c.id, next.trim());
                  }}
                ><Pencil size={11} /></button>
                <button
                  className="opacity-0 group-hover:opacity-100 os-faint"
                  title="Apagar"
                  onClick={async () => {
                    await remove(c.id);
                    if (c.id === conversationId) navigate("/clientes/dashboard/altusos");
                  }}
                ><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="flex flex-col" style={{ height: "min(72vh, 660px)" }}>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,.15)" }}>
                  <Sparkles size={18} style={{ color: "var(--os-accent)" }} />
                </div>
                <div>
                  <p className="text-[15px]">Pergunta ao AltusOS o que quiseres sobre o teu negócio.</p>
                  <p className="text-xs os-faint mt-1">
                    Respondo apenas com os dados reais de {context?.client?.business_name ?? "o teu negócio"}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => submit(s)} className="os-btn !px-3 text-xs">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={m.id ?? i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed"
                  style={m.role === "user"
                    ? { background: "rgba(124,58,237,.18)", border: "1px solid rgba(124,58,237,.3)" }
                    : { background: "var(--os-panel-2)", border: "1px solid var(--os-line)" }}
                >
                  {m.role === "assistant" ? (
                    <>
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-strong:text-white">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => {
                              const target = String(href ?? "");
                              if (!target.startsWith("hub:")) return <span>{children}</span>;
                              return (
                                <button type="button" className="os-source-link" onClick={() => go(target.slice(4).split("?")[0])}>
                                  {children}
                                </button>
                              );
                            },
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                      {!m.pending && (m.sources?.length ?? 0) > 0 && (
                        <div className="mt-3 pt-2.5 border-t" style={{ borderColor: "var(--os-line)" }}>
                          <SourcesRow sources={m.sources ?? []} />
                          {m.confidence && (
                            <p className="text-[11px] os-faint mt-1.5">
                              Confiança: {m.confidence === "alta" ? "Alta" : m.confidence === "media" ? "Média" : "Baixa"}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : m.content}
                </div>
              </div>
            ))}

            {status === "submitted" && (
              <div className="flex items-center gap-2 text-xs os-faint">
                <Sparkles size={12} className="animate-pulse" style={{ color: "var(--os-accent)" }} />
                {thinking ? thinking.slice(-120) : "A analisar os teus dados…"}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-xs" style={{ color: "var(--os-amber)" }}>
                <AlertTriangle size={12} className="mt-0.5" /> {error}
              </div>
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(input); }}
            className="p-3 border-t flex gap-2 items-end"
            style={{ borderColor: "var(--os-line)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
              }}
              placeholder="Faz uma pergunta…"
              className="flex-1 bg-transparent border rounded-xl px-3.5 py-2.5 text-[13px] outline-none resize-none max-h-32"
              style={{ borderColor: "var(--os-line)" }}
            />
            <button type="submit" disabled={status !== "idle" || !input.trim()} className="os-btn">
              <Send size={13} /> Enviar
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
};

export default AltusOSView;
