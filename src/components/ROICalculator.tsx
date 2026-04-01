import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [formData, setFormData] = useState({ nome: "", email: "", telefone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const monthlyLoss = Math.round(messages * factor * 30 * clientValue);
  const annualLoss = monthlyLoss * 12;
  const hoursWasted = Math.round(messages * 0.08 * 30);
  const clientsLost = Math.round(messages * factor * 30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("leads" as any).insert({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || null,
        monthly_loss: monthlyLoss,
        source: "calculadora",
      } as any);
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Recebido!", description: "Entraremos em contacto em 24h." });
    } catch {
      toast({ title: "Erro", description: "Tenta novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="calculadora" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-4" style={{ fontWeight: 800 }}>
            Quanto está o teu negócio a{" "}
            <span className="text-gradient">perder agora?</span>
          </h2>
          <p className="text-[#9CA3AF] text-lg">
            Descobre em 10 segundos. Sem compromisso.
          </p>
        </motion.div>

        {/* Animated border wrapper for calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="animated-border-wrapper mb-8"
        >
          <div className="animated-border-inner p-6 sm:p-8 space-y-8">
            {/* Messages slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-[#9CA3AF]">Mensagens que recebes por dia</label>
                <span className="text-sm font-mono font-bold text-foreground">{messages} mensagens/dia</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={messages}
                onChange={(e) => setMessages(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Client value slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-[#9CA3AF]">Valor médio de um cliente</label>
                <span className="text-sm font-mono font-bold text-foreground">€{clientValue} por cliente</span>
              </div>
              <input
                type="range"
                min={20}
                max={5000}
                step={10}
                value={clientValue}
                onChange={(e) => setClientValue(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Response time select */}
            <div>
              <label className="text-sm text-[#9CA3AF] block mb-2">
                Quanto demoras a responder?
              </label>
              <select
                value={factor}
                onChange={(e) => setFactor(Number(e.target.value))}
                className="w-full rounded-xl px-4 py-3.5 text-foreground text-[0.9375rem] transition-all duration-200 border border-[#2A2040] focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
                style={{ background: "rgba(9,9,15,0.8)" }}
              >
                {RESPONSE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Result cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ResultCard emoji="💸" label="Perdes por mês" value={`€${monthlyLoss.toLocaleString()}`} color="text-red-400" isInView={isInView} delay={0.3} />
          <ResultCard emoji="📅" label="Perdes por ano" value={`€${annualLoss.toLocaleString()}`} color="text-red-400" isInView={isInView} delay={0.4} />
          <ResultCard emoji="⏰" label="Horas perdidas/mês" value={`${hoursWasted}h`} color="text-amber-400" isInView={isInView} delay={0.5} />
          <ResultCard emoji="👥" label="Clientes perdidos/mês" value={String(clientsLost)} color="text-foreground" isInView={isInView} delay={0.6} />
        </div>

        {/* Dynamic message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className={`p-4 rounded-2xl mb-8 text-center text-sm ${
            monthlyLoss < 500
              ? "border border-green-500/30 bg-green-950/20 text-green-300"
              : monthlyLoss < 2000
              ? "border border-amber-500/30 bg-amber-950/20 text-amber-300"
              : "border border-red-500/30 bg-red-950/20 text-red-300 animate-pulse"
          }`}
        >
          {monthlyLoss < 500
            ? "O impacto parece pequeno agora. Com mais clientes, multiplica."
            : monthlyLoss < 2000
            ? "Estás a perder o equivalente a um salário por mês."
            : "⚠️ CRÍTICO: Estás a perder o suficiente para contratar uma pessoa a tempo inteiro."}
        </motion.div>

        {/* Lead capture form */}
        {!submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="glass-card p-6 sm:p-8"
          >
            <h3 className="font-display text-xl text-foreground mb-4 text-center" style={{ fontWeight: 700 }}>
              Recupera este dinheiro — análise gratuita em 24h
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome *"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="rounded-xl px-4 py-3.5 text-foreground text-[0.9375rem] placeholder:text-[#6B7280] border border-[#2A2040] focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] transition-all duration-200"
                style={{ background: "rgba(9,9,15,0.8)" }}
              />
              <input
                type="tel"
                placeholder="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="rounded-xl px-4 py-3.5 text-foreground text-[0.9375rem] placeholder:text-[#6B7280] border border-[#2A2040] focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] transition-all duration-200"
                style={{ background: "rgba(9,9,15,0.8)" }}
              />
              <input
                type="email"
                placeholder="Email *"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="sm:col-span-2 rounded-xl px-4 py-3.5 text-foreground text-[0.9375rem] placeholder:text-[#6B7280] border border-[#2A2040] focus:border-[#8B5CF6] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] transition-all duration-200"
                style={{ background: "rgba(9,9,15,0.8)" }}
              />
              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 btn-primary !rounded-xl disabled:opacity-50"
              >
                {loading ? "A enviar..." : "Quero a análise gratuita →"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <p className="text-2xl mb-2">✅</p>
            <p className="text-foreground text-lg font-semibold">Recebemos o teu pedido!</p>
            <p className="text-[#9CA3AF]">Entraremos em contacto em 24h.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

const ResultCard = ({
  emoji,
  label,
  value,
  color,
  isInView,
  delay,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
  isInView: boolean;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ delay, duration: 0.5 }}
    className="rounded-2xl p-4 sm:p-5 text-center border border-[rgba(139,92,246,0.2)]"
    style={{ background: "rgba(139,92,246,0.06)" }}
  >
    <p className="text-2xl mb-1">{emoji}</p>
    <p className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-xl sm:text-2xl font-mono font-bold ${color}`} style={{ textShadow: "0 0 20px rgba(167,139,250,0.3)" }}>{value}</p>
  </motion.div>
);

export default ROICalculator;
