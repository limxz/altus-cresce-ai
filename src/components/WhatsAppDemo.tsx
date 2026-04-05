import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Send, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BUSINESS_TYPES = [
  { key: "restaurante", label: "Restaurante" },
  { key: "clinica", label: "Clínica Estética" },
  { key: "ginasio", label: "Ginásio" },
  { key: "imobiliaria", label: "Imobiliária" },
  { key: "cabeleireiro", label: "Cabeleireiro" },
  { key: "outro", label: "Outro" },
];

const SCENARIO_SUGGESTIONS: Record<string, string[]> = {
  restaurante: [
    "Têm mesa para 2 hoje às 20h?",
    "Qual o horário de funcionamento?",
    "Fazem entregas ao domicílio?",
  ],
  clinica: [
    "Qual o preço de uma consulta?",
    "Têm disponibilidade esta semana?",
    "Aceitam seguro de saúde?",
  ],
  ginasio: [
    "Como faço para me inscrever?",
    "Qual o valor da mensalidade?",
    "Têm aulas de grupo?",
  ],
  imobiliaria: [
    "Procuro apartamento T2 em Braga, têm?",
    "Qual a comissão de venda?",
    "Fazem avaliação do meu imóvel?",
  ],
  cabeleireiro: [
    "Têm disponibilidade para amanhã?",
    "Quanto custa corte e coloração?",
    "Fazem tratamentos capilares?",
  ],
  outro: [
    "Olá, gostava de saber mais informações.",
    "Quais os vossos serviços?",
    "Como posso marcar?",
  ],
};

const BUSINESS_NAMES: Record<string, string> = {
  restaurante: "Sabores de Braga",
  clinica: "Clínica Bella Estética",
  ginasio: "FitBraga Gym",
  imobiliaria: "Casa Minho Imobiliária",
  cabeleireiro: "Studio Hair Braga",
  outro: "O Teu Negócio",
};

const WhatsAppDemo = () => {
  const [businessType, setBusinessType] = useState("restaurante");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [msgCount, setMsgCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    setMessages([]);
    setMsgCount(0);
    setResponseTime(null);
  }, [businessType]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);
    setResponseTime(null);
    const start = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-demo", {
        body: { messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })), businessType },
      });
      if (error) throw error;
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      setResponseTime(Number(elapsed));
      await new Promise((r) => setTimeout(r, 1500));
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setMsgCount((c) => c + 1);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Desculpa, tive um problema técnico. Tenta novamente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-10">
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Experimenta o teu <span className="text-gradient">agente IA</span> agora
          </h2>
          <p className="text-muted-foreground text-lg">Escreve como se fosses um cliente do teu negócio</p>
        </motion.div>

        {/* Business type selector */}
        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 mb-8">
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.key}
              onClick={() => setBusinessType(bt.key)}
              className={`px-5 py-2 rounded-full text-[0.8125rem] font-medium transition-all duration-200 ${
                businessType === bt.key ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{
                background: businessType === bt.key ? "rgba(0,245,212,0.08)" : "transparent",
                border: `1px solid ${businessType === bt.key ? "rgba(0,245,212,0.4)" : "hsl(var(--border-subtle))"}`,
              }}
            >
              {bt.label}
            </button>
          ))}
        </motion.div>

        {/* Chat window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="rounded-[20px] overflow-hidden"
          style={{
            border: "1px solid rgba(123,47,255,0.15)",
            boxShadow: "0 0 60px rgba(123,47,255,0.06), 0 24px 48px rgba(0,0,0,0.4)",
          }}
        >
          {/* Chat header */}
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(28,24,41,0.8), rgba(22,18,35,0.7))", borderBottom: "1px solid rgba(123,47,255,0.1)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))", boxShadow: "0 0 16px rgba(123,47,255,0.4)" }}>
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">{BUSINESS_NAMES[businessType]}</p>
              <p className="text-muted-foreground text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent inline-block" style={{ boxShadow: "0 0 6px rgba(0,245,212,0.6)" }} />
                Online agora
              </p>
            </div>
          </div>

          {/* Messages area */}
          <div ref={chatRef} className="h-64 overflow-y-auto p-5 space-y-3" style={{ background: "hsl(var(--background))" }}>
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-8">Envia uma mensagem para começar...</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm ${
                    msg.role === "user" ? "text-white rounded-2xl rounded-br-sm" : "text-muted-foreground rounded-2xl rounded-bl-sm"
                  }`}
                  style={{
                    background: msg.role === "user" ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" : "rgba(28,24,41,0.7)",
                  }}
                >
                  {msg.role === "assistant" && <p className="text-[10px] text-accent/70 mb-0.5 font-mono">Assistente IA</p>}
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: "rgba(28,24,41,0.7)" }}>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-accent/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speed counter */}
          {responseTime && (
            <div className="px-5 pb-1" style={{ background: "hsl(var(--background))" }}>
              <p className="text-xs text-accent/70 font-mono">Respondido em {responseTime}s</p>
            </div>
          )}

          {/* Sugestões de mensagens */}
          {messages.length === 0 && (
            <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5" style={{ background: "hsl(var(--surface))", borderTop: "1px solid rgba(123,47,255,0.08)" }}>
              {(SCENARIO_SUGGESTIONS[businessType] || []).map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: "rgba(123,47,255,0.08)", border: "1px solid rgba(123,47,255,0.15)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="px-4 py-3 flex gap-2" style={{ background: "hsl(var(--surface))", borderTop: "1px solid rgba(123,47,255,0.1)" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escreve uma mensagem..."
              className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-all duration-200"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))", boxShadow: "0 0 16px rgba(123,47,255,0.3)" }}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>

        {/* CTA after 3 messages */}
        {msgCount >= 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass-card p-5 text-center">
            <p className="text-foreground text-sm mb-3">Este agente responde 24/7 sem custo de pessoal. Queres para o teu negócio?</p>
            <a href="https://cal.com/altusmedia" target="_blank" rel="noopener noreferrer" className="btn-primary !px-6 !py-2.5 !text-sm inline-block">
              Ver como funciona
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default WhatsAppDemo;
