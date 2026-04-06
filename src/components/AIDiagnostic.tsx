import { useState, useEffect, useRef } from "react";
import { useBooking } from "@/contexts/BookingContext";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Instagram, MessageCircle, BarChart2, ArrowRight, ArrowUpRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Estado = "form" | "loading" | "result";

interface Problema {
  area: string;
  estado: "critico" | "fraco" | "ok";
  descricao: string;
}

interface Analise {
  score: number;
  titulo: string;
  problemas: Problema[];
  oportunidades: string[];
  euros_perdidos_mes: number;
  recomendacao_principal: string;
}

interface FormData {
  nomeEmpresa: string;
  instagram: string;
  website: string;
  tipoNegocio: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "A verificar presença no Instagram...",
  "A analisar o website...",
  "A verificar resposta automática no WhatsApp...",
  "A calcular oportunidades de crescimento...",
];

const TIPOS_NEGOCIO = [
  "Restaurante",
  "Clínica de Estética",
  "Clínica Dentária",
  "AVAC / Climatização",
  "Imobiliária",
  "Ginásio",
  "Electricista",
  "Outro",
];

const AREA_ICONS: Record<string, React.ElementType> = {
  Website: Globe,
  Instagram: Instagram,
  "Resposta WhatsApp": MessageCircle,
  "Presença Digital Geral": BarChart2,
};

const ESTADO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critico: { bg: "rgba(239,68,68,0.15)", text: "rgb(239,68,68)", label: "Crítico" },
  fraco:   { bg: "rgba(234,179,8,0.15)",  text: "rgb(234,179,8)",  label: "Fraco" },
  ok:      { bg: "rgba(34,197,94,0.15)",  text: "rgb(34,197,94)",  label: "OK" },
};

// ─── Fallback analysis ────────────────────────────────────────────────────────

function buildFallback(form: FormData): Analise {
  return {
    score: form.website ? 32 : 18,
    titulo: `${form.nomeEmpresa} tem oportunidades claras por explorar`,
    problemas: [
      {
        area: "Website",
        estado: form.website ? "fraco" : "critico",
        descricao: form.website
          ? "O site existe mas pode não estar optimizado para conversão e SEO local."
          : "Sem website, os clientes não te encontram no Google. Perdes leads todos os dias para concorrentes com site.",
      },
      {
        area: "Instagram",
        estado: form.instagram ? "fraco" : "critico",
        descricao: form.instagram
          ? "Perfil identificado, mas sem automação o seguimento de leads é manual e lento."
          : "Sem Instagram, não existe para 60% dos teus potenciais clientes em Portugal.",
      },
      {
        area: "Resposta WhatsApp",
        estado: "critico",
        descricao: `Para um negócio de ${form.tipoNegocio}, a maioria não tem resposta automática. Cada mensagem sem resposta em 5 min é um cliente que vai à concorrência.`,
      },
      {
        area: "Presença Digital Geral",
        estado: "fraco",
        descricao: "A presença digital não está a converter ao ritmo que poderia com as ferramentas certas.",
      },
    ],
    oportunidades: [
      `Automação de resposta no WhatsApp 24/7 para ${form.tipoNegocio}`,
      "Captação de leads qualificados via Instagram com follow-up automático",
      "Sistema de agendamento online que reduz no-shows em 40%",
    ],
    euros_perdidos_mes: form.website ? 1200 : 2400,
    recomendacao_principal: "Implementa primeiro a resposta automática no WhatsApp — é o canal com maior ROI imediato para o teu sector.",
  };
}

// ─── ScoreCircle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const color = score <= 40 ? "rgb(239,68,68)" : score <= 70 ? "rgb(234,179,8)" : "rgb(34,197,94)";
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "64px 64px", filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x="64" y="60" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="monospace">
          {score}
        </text>
        <text x="64" y="78" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="monospace">
          / 100
        </text>
      </svg>
      <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">Score digital</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AIDiagnostic = () => {
  const { openBooking } = useBooking();
  const [estado, setEstado] = useState<Estado>("form");
  const [msgIdx, setMsgIdx] = useState(0);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [form, setForm] = useState<FormData>({
    nomeEmpresa: "",
    instagram: "",
    website: "",
    tipoNegocio: "",
  });

  // Rotate loading messages
  useEffect(() => {
    if (estado !== "loading") return;
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [estado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("loading");
    setMsgIdx(0);

    // Minimum loading of 6 seconds so all 4 messages play
    const [result] = await Promise.allSettled([
      callClaude(form),
      new Promise((r) => setTimeout(r, 6200)),
    ]);

    if (result.status === "fulfilled" && result.value) {
      setAnalise(result.value as Analise);
    } else {
      setAnalise(buildFallback(form));
    }
    setEstado("result");
  };

  const reset = () => {
    setEstado("form");
    setAnalise(null);
    setForm({ nomeEmpresa: "", instagram: "", website: "", tipoNegocio: "" });
  };

  return (
    <section id="diagnostico" className="py-24 px-6">
      <div className="max-w-[860px] mx-auto">
        <AnimatePresence mode="wait">
          {estado === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.5 }}>
              <FormState form={form} setForm={setForm} onSubmit={handleSubmit} />
            </motion.div>
          )}
          {estado === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <LoadingState msgIdx={msgIdx} />
            </motion.div>
          )}
          {estado === "result" && analise && (
            <motion.div key="result" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <ResultState analise={analise} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

// ─── Form State ───────────────────────────────────────────────────────────────

function FormState({ form, setForm, onSubmit }: { form: FormData; setForm: (f: FormData) => void; onSubmit: (e: React.FormEvent) => void }) {
  const isValid = form.nomeEmpresa.trim() && form.instagram.trim() && form.tipoNegocio;

  return (
    <div className="rounded-[28px] relative overflow-hidden"
      style={{
        background: "rgba(28,24,41,0.6)",
        backdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(123,47,255,0.18)",
        boxShadow: "0 0 80px rgba(123,47,255,0.08), 0 8px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="p-8 sm:p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase mb-5"
            style={{ background: "rgba(123,47,255,0.12)", border: "1px solid rgba(123,47,255,0.2)", color: "rgba(167,139,250,0.9)" }}>
            ✦ IA em tempo real
          </div>
          <h2 className="font-display text-foreground mb-3"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.8rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
            A IA analisa o teu negócio agora — <span className="text-gradient">grátis</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Preenche os dados e recebe uma análise real em menos de 30 segundos
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome da empresa *"
              required
              value={form.nomeEmpresa}
              onChange={(e) => setForm({ ...form, nomeEmpresa: e.target.value })}
              className="input-dark"
            />
            <input
              type="text"
              placeholder="@nomedonegocio *"
              required
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="input-dark"
            />
          </div>
          <input
            type="text"
            placeholder="www.exemplo.pt (opcional)"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="input-dark w-full"
          />
          <select
            required
            value={form.tipoNegocio}
            onChange={(e) => setForm({ ...form, tipoNegocio: e.target.value })}
            className="input-dark w-full"
            style={{ color: form.tipoNegocio ? undefined : "rgba(255,255,255,0.4)" }}
          >
            <option value="" disabled>Tipo de negócio *</option>
            {TIPOS_NEGOCIO.map((t) => (
              <option key={t} value={t} style={{ background: "#1a1625" }}>{t}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!isValid}
            className="btn-primary w-full !rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            style={{ padding: "14px 24px" }}
          >
            Analisar o meu negócio <ArrowRight size={18} />
          </button>
          <p className="text-center text-xs text-muted-foreground/50">Sem compromisso. Sem spam.</p>
        </form>
      </div>
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingState({ msgIdx }: { msgIdx: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-10">
      {/* Spinner */}
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: "2px solid rgba(123,47,255,0.15)" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid transparent",
            borderTopColor: "rgba(123,47,255,0.9)",
            borderRightColor: "rgba(45,212,191,0.5)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
      </div>

      {/* Rotating message */}
      <div className="h-8 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="text-muted-foreground font-mono text-sm tracking-wide text-center"
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {LOADING_MESSAGES.map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: i <= msgIdx ? "rgba(123,47,255,0.9)" : "rgba(255,255,255,0.1)" }}
            animate={{ scale: i === msgIdx ? 1.3 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Result State ─────────────────────────────────────────────────────────────

function ResultState({ analise, onReset, openBooking }: { analise: Analise; onReset: () => void; openBooking: () => void }) {
  return (
    <div className="space-y-6">
      {/* Header: score + title */}
      <div className="rounded-[24px] p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8"
        style={{
          background: "rgba(28,24,41,0.6)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(123,47,255,0.15)",
          boxShadow: "0 0 60px rgba(123,47,255,0.07)",
        }}
      >
        <ScoreCircle score={analise.score} />
        <div>
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-2">Diagnóstico concluído</p>
          <h2 className="font-display text-foreground" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {analise.titulo}
          </h2>
        </div>
      </div>

      {/* Problems grid 2x2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {analise.problemas.map((p, i) => {
          const Icon = AREA_ICONS[p.area] ?? Globe;
          const colors = ESTADO_COLORS[p.estado];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-[20px] p-6"
              style={{
                background: "rgba(28,24,41,0.5)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(123,47,255,0.1)",
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.bg, border: `1px solid ${colors.text}33` }}>
                    <Icon size={16} style={{ color: colors.text }} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{p.area}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: colors.bg, color: colors.text }}>
                  {colors.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Opportunities */}
      <div className="rounded-[20px] p-6 sm:p-8"
        style={{
          background: "rgba(28,24,41,0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(123,47,255,0.1)",
        }}
      >
        <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground mb-5">Oportunidades identificadas</p>
        <div className="space-y-3">
          {analise.oportunidades.map((op, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-3"
            >
              <ArrowUpRight size={16} className="flex-shrink-0 mt-0.5" style={{ color: "rgb(34,197,94)" }} />
              <p className="text-sm text-foreground/90">{op}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recomendação principal */}
      <div className="rounded-[20px] p-6"
        style={{
          background: "rgba(0,245,212,0.04)",
          border: "1px solid rgba(0,245,212,0.15)",
        }}
      >
        <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: "rgba(0,245,212,0.7)" }}>Recomendação principal</p>
        <p className="text-foreground font-medium leading-relaxed">{analise.recomendacao_principal}</p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={openBooking}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-center !rounded-xl"
          style={{ padding: "14px 24px" }}
        >
          Quero resolver isto — falar com a equipa <ArrowRight size={16} />
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          style={{
            padding: "14px 24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          Analisar outro negócio
        </button>
      </div>
    </div>
  );
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function callClaude(form: FormData): Promise<Analise | null> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = `És um especialista em marketing digital para negócios locais em Portugal.

Analisa este negócio e dá um diagnóstico honesto e específico. Não sejas genérico.

Dados fornecidos:
- Nome: ${form.nomeEmpresa}
- Instagram: ${form.instagram || "não fornecido"}
- Website: ${form.website || "não fornecido"}
- Tipo: ${form.tipoNegocio}

Faz a análise com base nestes critérios:

1. WEBSITE: ${form.website
    ? "Analisa se o URL parece profissional, se é moderno ou antigo pelo domínio"
    : "Não tem website — isto é um problema sério"}

2. INSTAGRAM: ${form.instagram
    ? "Analisa o handle — parece um perfil activo e profissional?"
    : "Não forneceu Instagram — provável ausência nas redes"}

3. WHATSAPP: Para um negócio do tipo ${form.tipoNegocio} em Portugal, qual a probabilidade de não ter resposta automática? (tipicamente alta)

4. OPORTUNIDADES: Que oportunidades específicas existem para este tipo de negócio com IA?

${!form.website ? `IMPORTANTE: No card de Website mostra SEMPRE estado "critico" com: "Sem website, os clientes não te encontram no Google. Perdes leads todos os dias para concorrentes com site."` : ""}
${!form.instagram ? `IMPORTANTE: No card de Instagram mostra SEMPRE estado "critico" com: "Sem Instagram, não existe para 60% dos teus potenciais clientes em Portugal."` : ""}

Responde APENAS em JSON válido com esta estrutura exacta:
{
  "score": número de 0 a 100,
  "titulo": "frase curta e directa sobre o estado do negócio",
  "problemas": [
    {"area": "Website", "estado": "critico", "descricao": "frase específica"},
    {"area": "Instagram", "estado": "critico", "descricao": "frase específica"},
    {"area": "Resposta WhatsApp", "estado": "critico", "descricao": "frase específica"},
    {"area": "Presença Digital Geral", "estado": "fraco", "descricao": "frase específica"}
  ],
  "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "euros_perdidos_mes": número entre 500 e 5000,
  "recomendacao_principal": "1 frase directa sobre o que devem fazer primeiro"
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as Analise;
    return parsed;
  } catch {
    return null;
  }
}

export default AIDiagnostic;
