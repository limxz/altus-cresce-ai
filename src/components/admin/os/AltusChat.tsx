import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { X, ArrowUp, Loader2 } from "lucide-react";

interface Msg { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Quais clientes estão em risco?",
  "Quanto faturámos este mês?",
  "Que campanhas devo otimizar?",
  "O que devo fazer primeiro hoje?",
];

const AltusChat = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 220);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("altus-intelligence", {
        body: { mode: "chat", messages: next },
      });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data?.reply ?? data?.erro ?? "Sem resposta." }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Não consegui responder: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50"
            style={{ backdropFilter: "blur(2px)" }}
          />
          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-[61] w-full sm:w-[420px] os-glass flex flex-col"
          >
            <header className="flex items-center justify-between px-5 h-[60px] border-b" style={{ borderColor: "var(--os-line)" }}>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--os-accent)", boxShadow: "0 0 12px var(--os-accent)" }} />
                <span className="text-sm font-medium">Altus Intelligence</span>
              </div>
              <button onClick={onClose} className="os-btn !h-8 !w-8 !p-0 justify-center"><X size={14} /></button>
            </header>

            <div className="flex-1 overflow-y-auto os-scroll px-5 py-5 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm os-dim leading-relaxed">
                    Pergunta-me qualquer coisa sobre a operação. Tenho acesso a clientes, conversas, pipeline, leads e métricas.
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="os-btn w-full !justify-start !h-auto py-2 text-left os-dim hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={m.role === "user" ? "flex justify-end" : ""}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm" style={{ background: "var(--os-accent)", color: "#fff" }}>
                      {m.content}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-white/90">{m.content}</div>
                  )}
                </motion.div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-sm os-faint">
                  <Loader2 size={13} className="animate-spin" /> A analisar dados…
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t" style={{ borderColor: "var(--os-line)" }}>
              <div className="os-panel flex items-end gap-2 p-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                  }}
                  placeholder="Perguntar ao Altus…"
                  className="flex-1 resize-none bg-transparent text-sm outline-none px-2 py-1.5 max-h-32 placeholder:text-white/25"
                />
                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || busy}
                  className="os-btn os-btn-accent !h-8 !w-8 !p-0 justify-center disabled:opacity-40"
                >
                  <ArrowUp size={14} />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AltusChat;
