import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingDown, Calendar, Clock, Users } from "lucide-react";

const RESPONSE_OPTIONS = [
  { label: "Imediato (0-5 min)", value: 0.03 },
  { label: "1-2 horas", value: 0.15 },
  { label: "3-6 horas", value: 0.28 },
  { label: "Mais de 6 horas", value: 0.38 },
  { label: "Só no dia seguinte", value: 0.52 },
];

const ROICalculator = () => {
  const [messages, setMessages] = useState(15);
  const [clientValue, setClientValue] = useState(150);
  const [factor, setFactor] = useState(0.15);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const monthlyLoss = Math.round(messages * factor * 30 * clientValue);
  const annualLoss = monthlyLoss * 12;
  const hoursWasted = Math.round(messages * 0.08 * 30);
  const clientsLost = Math.round(messages * factor * 30);

  const resultCards = [
    { icon: TrendingDown, label: "Perdes por mês", value: `€${monthlyLoss.toLocaleString()}`, color: "239,68,68" },
    { icon: Calendar, label: "Perdes por ano", value: `€${annualLoss.toLocaleString()}`, color: "239,68,68" },
    { icon: Clock, label: "Horas perdidas/mês", value: `${hoursWasted}h`, color: "234,179,8" },
    { icon: Users, label: "Clientes perdidos/mês", value: String(clientsLost), color: "0,245,212" },
  ];

  return (
    <section id="calculadora" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Quanto está o teu negócio a{" "}
            <span className="text-gradient">perder agora?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Descobre em 10 segundos. Sem compromisso.
          </p>
        </motion.div>

        {/* Liquid glass calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-10 rounded-[24px] relative overflow-hidden"
          style={{
            background: "rgba(28, 24, 41, 0.55)",
            backdropFilter: "blur(32px) saturate(200%)",
            WebkitBackdropFilter: "blur(32px) saturate(200%)",
            border: "1px solid rgba(123,47,255,0.15)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.35), 0 0 60px rgba(123,47,255,0.06)",
          }}
        >
          {/* Top edge highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
          <div className="relative z-10 p-6 sm:p-10 space-y-8">
            {/* Messages slider */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm text-muted-foreground">Mensagens que recebes por dia</label>
                <span className="text-sm font-mono font-medium text-accent">{messages} mensagens/dia</span>
              </div>
              <input type="range" min={1} max={100} value={messages} onChange={(e) => setMessages(Number(e.target.value))} className="w-full" />
            </div>

            {/* Client value slider */}
            <div>
              <div className="flex justify-between mb-3">
                <label className="text-sm text-muted-foreground">Valor médio de um cliente</label>
                <span className="text-sm font-mono font-medium text-accent">€{clientValue} por cliente</span>
              </div>
              <input type="range" min={20} max={5000} step={10} value={clientValue} onChange={(e) => setClientValue(Number(e.target.value))} className="w-full" />
            </div>

            {/* Response time select */}
            <div>
              <label className="text-sm text-muted-foreground block mb-3">Quanto demoras a responder?</label>
              <select value={factor} onChange={(e) => setFactor(Number(e.target.value))} className="input-dark w-full">
                {RESPONSE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "hsl(var(--surface))" }}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Result cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {resultCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className="rounded-[20px] p-6 text-center transition-all duration-300 group relative overflow-hidden"
              style={{
                background: "rgba(28, 24, 41, 0.5)",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                border: "1px solid rgba(123,47,255,0.12)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `rgba(${card.color},0.35)`;
                e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 32px rgba(${card.color},0.1), 0 8px 32px rgba(0,0,0,0.3)`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(123,47,255,0.12)";
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.25)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `rgba(${card.color},0.1)`, border: `1px solid rgba(${card.color},0.15)` }}>
                <card.icon size={18} style={{ color: `rgb(${card.color})` }} />
              </div>
              <p className="font-mono text-[0.625rem] tracking-[0.12em] uppercase text-muted-foreground mb-2">{card.label}</p>
              <p className="font-mono text-xl sm:text-2xl font-medium" style={{ color: `rgb(${card.color})`, textShadow: `0 0 20px rgba(${card.color},0.3)` }}>{card.value}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ROICalculator;
