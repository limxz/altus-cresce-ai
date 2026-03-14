import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";

interface Message {
  role: "user" | "ai";
  content: string;
}

const getMockResponse = (message: string, count: number): string => {
  const lower = message.toLowerCase();

  if (count >= 5) {
    return "Parece que o teu negócio tem muito potencial! 🚀 Que tal marcarmos uma chamada gratuita de 20 minutos? Posso ajudar-te a agendar!";
  }
  if (lower.includes("preço") || lower.includes("custo") || lower.includes("quanto")) {
    return "Os nossos pacotes começam nos €297/mês (Starter), €497/mês (Growth) e €797/mês (Pro). Qual se adapta melhor ao teu negócio?";
  }
  if (lower.includes("serviço") || lower.includes("fazem") || lower.includes("oferecem")) {
    return "Oferecemos gestão de redes sociais com IA, publicidade Meta & Google Ads, e automações inteligentes. Qual te interessa mais? 🎯";
  }
  if (lower.includes("restaurante") || lower.includes("comida") || lower.includes("café")) {
    return "Excelente! Temos ótimos resultados com restaurantes em Braga. Conseguimos aumentar reservas e visibilidade nas redes. Quantos clientes novos queres por mês?";
  }
  if (lower.includes("clínica") || lower.includes("saúde") || lower.includes("estética")) {
    return "Clínicas são um dos nossos pontos fortes! Criamos sistemas que atraem pacientes e marcam consultas automaticamente. Queres saber mais?";
  }

  const defaults = [
    "Interessante! Qual é o teu principal objetivo — mais seguidores, mais clientes, ou ambos? 🤔",
    "Atualmente já fazes algum marketing digital, ou estás a começar do zero?",
    "Muitos negócios em Braga têm esse desafio. Nós podemos ajudar! Queres marcar uma chamada gratuita para falarmos melhor? 📞",
  ];
  return defaults[count % defaults.length];
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasShownInitial, setHasShownInitial] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMsgCount = useRef(0);

  // Auto-open after 5 seconds with initial message
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasShownInitial) {
        setMessages([
          {
            role: "ai",
            content:
              "Olá! 👋 Sou o Altus AI. Posso ajudar o teu negócio a crescer com inteligência artificial. Que tipo de negócio tens?",
          },
        ]);
        setHasShownInitial(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasShownInitial]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    userMsgCount.current += 1;

    setIsTyping(true);
    setTimeout(() => {
      const response = getMockResponse(userMsg, userMsgCount.current);
      setMessages((prev) => [...prev, { role: "ai", content: response }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-20 right-0 w-[340px] sm:w-[380px] h-[500px] bg-card/95 backdrop-blur-2xl rounded-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow:
                "0 0 0 1px hsl(262 83% 58% / 0.15), 0 25px 50px -12px hsl(0 0% 0% / 0.6)",
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-primary/10 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-semibold text-foreground text-sm">
                  Altus AI 🤖
                </span>
                <span className="text-xs text-muted-foreground">Online agora</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground/90 border border-primary/5 rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted border border-primary/5 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-1" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-2" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing-3" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-primary/10 bg-background/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreve aqui..."
                  className="flex-1 bg-muted border border-primary/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!hasShownInitial) {
            setMessages([
              {
                role: "ai",
                content:
                  "Olá! 👋 Sou o Altus AI. Posso ajudar o teu negócio a crescer com inteligência artificial. Que tipo de negócio tens?",
              },
            ]);
            setHasShownInitial(true);
          }
        }}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_30px_hsl(262_83%_58%/0.4)] animate-chat-pulse relative group"
      >
        <div className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-20 transition-opacity" />
        {isOpen ? (
          <X className="text-primary-foreground" size={24} />
        ) : (
          <MessageSquare className="text-primary-foreground" size={24} />
        )}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
