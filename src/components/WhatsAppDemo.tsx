import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BUSINESS_TYPES = [
  { key: "restaurante", emoji: "🍽️", label: "Restaurante" },
  { key: "clinica", emoji: "💆", label: "Clínica Estética" },
  { key: "ginasio", emoji: "🏋️", label: "Ginásio" },
  { key: "imobiliaria", emoji: "🏠", label: "Imobiliária" },
  { key: "cabeleireiro", emoji: "✂️", label: "Cabeleireiro" },
  { key: "outro", emoji: "⚙️", label: "Outro" },
];

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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Reset when business type changes
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
        body: {
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          businessType,
        },
      });

      if (error) throw error;

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      setResponseTime(Number(elapsed));

      // Simulate typing delay
      await new Promise((r) => setTimeout(r, 1500));

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setMsgCount((c) => c + 1);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpa, tive um problema técnico. Tenta novamente." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <section ref={sectionRef} className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
            Experimenta o teu <span className="text-gradient">agente IA</span> agora
          </h2>
          <p className="text-muted-foreground text-lg">
            Escreve como se fosses um cliente do teu negócio
          </p>
        </motion.div>

        {/* Business type selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {BUSINESS_TYPES.map((bt) => (
            <button
              key={bt.key}
              onClick={() => setBusinessType(bt.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                businessType === bt.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {bt.emoji} {bt.label}
            </button>
          ))}
        </motion.div>

        {/* WhatsApp-styled chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden border border-border shadow-2xl"
        >
          {/* Chat header */}
          <div className="bg-[#1D9E75] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              IA
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {BUSINESS_NAMES[businessType]}
              </p>
              <p className="text-white/70 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-300 inline-block" />
                Online agora
              </p>
            </div>
          </div>

          {/* Messages area */}
          <div ref={chatRef} className="bg-[#0B0B14] h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-8">
                Envia uma mensagem para começar...
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-[#1D9E75] text-white rounded-2xl rounded-br-sm"
                      : "bg-[#1A1730] text-[#CCCCDD] rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <p className="text-[10px] text-primary/70 mb-0.5">🤖 Assistente IA</p>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1A1730] text-[#CCCCDD] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Speed counter */}
          {responseTime && (
            <div className="bg-[#0B0B14] px-4 pb-1">
              <p className="text-xs text-primary/70">⚡ Respondido em {responseTime}s</p>
            </div>
          )}

          {/* Input bar */}
          <div className="bg-[#12101F] px-3 py-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escreve uma mensagem..."
              className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>

        {/* CTA after 3 messages */}
        {msgCount >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-card p-5 text-center"
          >
            <p className="text-foreground text-sm mb-3">
              🚀 Este agente responde 24/7 sem custo de pessoal. Queres para o teu negócio?
            </p>
            <a
              href="https://cal.com/altusmedia"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary !px-6 !py-2.5 !text-sm inline-block"
            >
              Ver como funciona →
            </a>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default WhatsAppDemo;
