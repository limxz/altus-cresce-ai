import { useState } from "react";
import { FadeIn } from "./FadeIn";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AuditCategory {
  name: string;
  score: number;
  issues: string[];
  opportunities: string[];
}

interface AuditResult {
  score: number;
  score_label: string;
  categories: AuditCategory[];
  estimated_monthly_loss: number;
  top_recommendation: string;
  quick_wins: string[];
}

const BUSINESS_TYPES = [
  "Restauração", "Saúde e Bem-estar", "Comércio Local",
  "Serviços", "E-commerce", "Imobiliária", "Ginásio", "Outro"
];

const LOADING_MESSAGES = [
  "A verificar presença online...",
  "A analisar concorrência...",
  "A calcular oportunidades...",
];

const AuditWidget = () => {
  const [form, setForm] = useState({ url: "", business_name: "", business_type: "Restauração", city: "Braga", email: "", instagram: "" });
  const [igError, setIgError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.email) return;
    if (!form.instagram.startsWith("@") || form.instagram.length < 2) {
      setIgError("Introduz o Instagram começando por @ (ex: @omeutnegocio)");
      return;
    }
    setIgError("");

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);
    setLoadingMsg(0);

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 95));
    }, 60);
    const msgInterval = setInterval(() => {
      setLoadingMsg(m => (m + 1) % LOADING_MESSAGES.length);
    }, 1000);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("audit-business", {
        body: { business_name: form.business_name, business_type: form.business_type, city: form.city, url: form.url, instagram: form.instagram }
      });

      if (fnError) throw fnError;
      const audit = data?.audit as AuditResult;
      if (!audit) throw new Error("No audit data");

      setResult(audit);
      setProgress(100);

      // Save to DB
      await supabase.from("audits" as any).insert({
        business_name: form.business_name,
        business_type: form.business_type,
        city: form.city,
        url: form.url || null,
        email: form.email,
        score: audit.score,
        audit_json: audit as any,
      });
    } catch (err: any) {
      setError(err.message || "Erro ao gerar auditoria. Tenta novamente.");
    } finally {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => s < 40 ? "text-red-400" : s < 70 ? "text-amber-400" : "text-green-400";
  const scoreBg = (s: number) => s < 40 ? "bg-red-500" : s < 70 ? "bg-amber-500" : "bg-green-500";

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="font-display text-3xl md:text-4xl text-center text-foreground mb-2">
            Auditoria gratuita do teu negócio em 60 segundos
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            Descobre exactamente o que estás a perder online. Com IA.
          </p>
        </FadeIn>

        {!result && !loading && (
          <FadeIn delay={0.1}>
            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  placeholder="Nome do teu negócio *"
                  value={form.business_name}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
                <select
                  value={form.business_type}
                  onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:border-primary text-sm"
                >
                  {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  placeholder="URL do teu site (opcional)"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
                <input
                  placeholder="Cidade"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <input
                type="email"
                placeholder="Email para receber o relatório *"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" className="btn-primary w-full !py-3">
                Auditar o meu negócio agora →
              </button>
            </form>
          </FadeIn>
        )}

        {loading && (
          <FadeIn>
            <div className="glass-card p-8 text-center space-y-4">
              <Loader2 className="animate-spin text-primary mx-auto" size={40} />
              <p className="text-foreground font-medium">🔍 A Altus Media está a analisar o teu negócio...</p>
              <p className="text-muted-foreground text-sm">{LOADING_MESSAGES[loadingMsg]}</p>
              <Progress value={progress} className="h-2" />
            </div>
          </FadeIn>
        )}

        {result && (
          <div className="space-y-6">
            {/* Score */}
            <FadeIn>
              <div className="glass-card p-8 text-center">
                <div className={`font-display text-7xl ${scoreColor(result.score)}`}>{result.score}</div>
                <p className="text-muted-foreground text-sm mt-1">{result.score_label}</p>
              </div>
            </FadeIn>

            {/* Categories */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.categories.map((cat, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="glass-card p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-foreground font-medium text-sm">{cat.name}</h4>
                      <span className={`text-sm font-bold ${scoreColor(cat.score)}`}>{cat.score}/100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${scoreBg(cat.score)}`} style={{ width: `${cat.score}%` }} />
                    </div>
                    <div className="space-y-1">
                      {cat.issues.map((issue, j) => (
                        <p key={j} className="text-red-400 text-xs flex items-start gap-1.5">
                          <span>❌</span> {issue}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      {cat.opportunities.map((opp, j) => (
                        <p key={j} className="text-green-400 text-xs flex items-start gap-1.5">
                          <span>✅</span> {opp}
                        </p>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            {/* Loss highlight */}
            <FadeIn>
              <div className="glass-card p-6 border-red-500/30 border text-center">
                <p className="text-red-400 text-lg font-medium">
                  Estás a perder €{result.estimated_monthly_loss}/mês
                </p>
              </div>
            </FadeIn>

            {/* Top recommendation */}
            <FadeIn>
              <div className="glass-card p-6 border-primary/30 border">
                <p className="text-primary text-sm font-medium mb-1">💡 Recomendação principal</p>
                <p className="text-foreground text-sm">{result.top_recommendation}</p>
              </div>
            </FadeIn>

            {/* Quick wins */}
            <FadeIn>
              <div className="glass-card p-6">
                <p className="text-foreground font-medium text-sm mb-3">Vitórias rápidas:</p>
                <ul className="space-y-2">
                  {result.quick_wins.map((w, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-green-400 shrink-0" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            {/* CTA */}
            <FadeIn>
              <div className="text-center">
                <a
                  href="https://cal.com/altusmedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2 !px-8 !py-3"
                >
                  Quero resolver isto com a Altus Media → <ExternalLink size={16} />
                </a>
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </section>
  );
};

export default AuditWidget;
