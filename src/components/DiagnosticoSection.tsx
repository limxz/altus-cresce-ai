import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Star, Sparkles, ArrowRight, Lightbulb, Target, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBooking } from "@/contexts/BookingContext";
import { Progress } from "@/components/ui/progress";
import { FadeIn } from "@/components/FadeIn";

const SETORES = [
  "Restauração",
  "Saúde e Bem-estar",
  "Comércio Local",
  "Serviços",
  "E-commerce",
  "Outro",
];

interface DiagnosticoResult {
  score: number;
  nome_negocio: string;
  presenca_online: { nota: number; analise: string; melhoria: string };
  comunicacao_conteudo: { nota: number; analise: string; melhoria: string };
  atendimento_cliente: { nota: number; analise: string; melhoria: string };
  publicidade: { nota: number; analise: string; melhoria: string };
  site_conversao: { nota: number; analise: string; melhoria: string };
  conclusao: string;
  top_3_prioridades: string[];
}

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={16}
        className={i <= count ? "fill-primary text-primary" : "text-muted-foreground/30"}
      />
    ))}
  </div>
);

const SectionCard = ({
  title,
  data,
  delay,
}: {
  title: string;
  data: { nota: number; analise: string; melhoria: string };
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card p-6 space-y-3"
  >
    <div className="flex items-center justify-between">
      <h4 className="font-display font-semibold text-foreground">{title}</h4>
      <Stars count={data.nota} />
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed">{data.analise}</p>
    <div className="rounded-lg p-3" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
      <p className="text-sm text-foreground flex items-start gap-2">
        <Lightbulb size={14} className="text-primary mt-0.5 shrink-0" />
        <span><span className="font-semibold">Como melhorar:</span> {data.melhoria}</span>
      </p>
    </div>
  </motion.div>
);

const DiagnosticoSection = () => {
  const { openBooking } = useBooking();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    instagram_url: "",
    site_url: "",
    setor: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticoResult | null>(null);
  const [error, setError] = useState("");
  const [animatedScore, setAnimatedScore] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("diagnose-business", {
        body: {
          setor: form.setor,
          instagram_url: form.instagram_url,
          site_url: form.site_url || null,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const diagnostico = data.diagnostico as DiagnosticoResult;
      setResult(diagnostico);

      let current = 0;
      const target = diagnostico.score;
      const step = Math.max(1, Math.floor(target / 60));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        setAnimatedScore(current);
      }, 20);

      await supabase.from("diagnosticos" as any).insert({
        nome: form.nome,
        email: form.email,
        instagram_url: form.instagram_url,
        site_url: form.site_url || null,
        setor: form.setor,
        score: diagnostico.score,
        diagnostico_json: diagnostico as any,
      });
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    animatedScore >= 70 ? "text-[hsl(var(--success))]" : animatedScore >= 40 ? "text-[hsl(var(--warning))]" : "text-destructive";

  return (
    <section id="diagnostico" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(139,92,246,0.05)" }} />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <FadeIn>
          <div className="text-center mb-12">
            <div className="badge-pill mb-6 mx-auto w-fit">
              <Sparkles size={14} />
              Análise gratuita com IA
            </div>
            <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Diagnóstico Gratuito do Teu Negócio com IA
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Introduz o teu Instagram e site (opcional) e recebe uma análise completa em segundos.
            </p>
          </div>
        </FadeIn>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome *</label>
                    <input
                      required
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="input-dark"
                      placeholder="O teu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-dark"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Link do Instagram *</label>
                  <input
                    required
                    pattern="https?://(www\.)?instagram\.com/.+"
                    title="Introduz um link válido do Instagram (ex: https://instagram.com/o-teu-negocio)"
                    value={form.instagram_url}
                    onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                    className="input-dark"
                    placeholder="https://instagram.com/o-teu-negocio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Link do site (opcional)</label>
                  <input
                    value={form.site_url}
                    onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                    className="input-dark"
                    placeholder="https://o-teu-site.pt"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Setor do negócio *</label>
                  <select
                    required
                    value={form.setor}
                    onChange={(e) => setForm({ ...form, setor: e.target.value })}
                    className="input-dark"
                  >
                    <option value="" style={{ background: "hsl(var(--surface))" }}>Seleciona o setor</option>
                    {SETORES.map((s) => (
                      <option key={s} value={s} style={{ background: "hsl(var(--surface))" }}>{s}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      A IA está a analisar o teu negócio...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analisar o meu negócio gratuitamente
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Score circle */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card p-8 text-center"
              >
                <p className="text-sm text-muted-foreground mb-2">Pontuação geral de</p>
                <p className="text-lg font-display font-semibold text-foreground mb-4">{result.nome_negocio}</p>
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(animatedScore / 100) * 327} 327`}
                      className="transition-all duration-100"
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-4xl font-display font-bold ${scoreColor}`}>
                    {animatedScore}
                  </span>
                </div>
                <Progress value={animatedScore} className="max-w-xs mx-auto h-2" />
              </motion.div>

              <SectionCard title="Presença Online" data={result.presenca_online} delay={0.1} />
              <SectionCard title="Comunicação e Conteúdo" data={result.comunicacao_conteudo} delay={0.2} />
              <SectionCard title="Atendimento ao Cliente" data={result.atendimento_cliente} delay={0.3} />
              <SectionCard title="Publicidade e Captação de Clientes" data={result.publicidade} delay={0.4} />
              <SectionCard title="Site e Conversão" data={result.site_conversao} delay={0.5} />

              {/* Top 3 Priorities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-6"
              >
                <h4 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target size={18} className="text-primary" /> Top 3 Prioridades
                </h4>
                <div className="flex flex-col gap-3">
                  {result.top_3_prioridades.map((p, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold font-mono">
                        {i + 1}
                      </span>
                      <p className="text-sm text-muted-foreground pt-1">{p}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Conclusion */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-card p-6"
                style={{ borderColor: "rgba(139,92,246,0.3)", boxShadow: "0 0 30px rgba(124,58,237,0.1)" }}
              >
                <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ClipboardList size={18} className="text-primary" /> Conclusão e Próximos Passos
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.conclusao}</p>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center space-y-4"
              >
                <button
                  onClick={openBooking}
                  className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
                >
                  Quero implementar estas melhorias
                  <ArrowRight size={20} />
                </button>
                <p className="text-xs text-muted-foreground">
                  Diagnóstico gerado pela <span className="text-primary font-medium">Altus Media</span> — Quer implementar estas melhorias?{" "}
                  <button onClick={openBooking} className="text-accent underline hover:text-primary transition-colors">
                    Marque uma consulta gratuita
                  </button>
                </p>
              </motion.div>

              {/* New analysis button */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setResult(null);
                    setAnimatedScore(0);
                    setForm({ nome: "", email: "", instagram_url: "", site_url: "", setor: "" });
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Fazer nova análise
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DiagnosticoSection;
