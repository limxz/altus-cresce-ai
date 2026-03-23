import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const BUSINESS_TYPES = [
  { emoji: "🍽️", label: "Restaurante" },
  { emoji: "💆", label: "Clínica" },
  { emoji: "🏋️", label: "Ginásio" },
  { emoji: "🏠", label: "Imobiliária" },
  { emoji: "✂️", label: "Cabeleireiro" },
  { emoji: "🦷", label: "Dentista" },
  { emoji: "🏪", label: "Comércio" },
  { emoji: "⚙️", label: "Outro" },
];

const PROBLEMS = [
  "Perco clientes por não responder a tempo",
  "Não tenho presença nas redes sociais",
  "Gasto demasiado tempo em tarefas repetitivas",
  "Não sei quantos leads estou a perder",
  "Os meus concorrentes estão à minha frente online",
  "Não tenho tempo para marketing",
];

const REVENUES = ["< €5.000", "€5k–€15k", "€15k–€30k", "€30k–€50k", "> €50k"];

const PlanoGratis = () => {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [problems, setProblems] = useState<string[]>([]);
  const [revenue, setRevenue] = useState("");
  const [contact, setContact] = useState({ nome: "", email: "", telefone: "" });
  const [loading, setLoading] = useState(false);
  const [planText, setPlanText] = useState("");
  const [displayedText, setDisplayedText] = useState("");

  const toggleProblem = (p: string) => {
    setProblems(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : prev.length < 2 ? [...prev, p] : prev
    );
  };

  const canNext = () => {
    if (step === 1) return businessName.trim().length > 0;
    if (step === 2) return businessType.length > 0;
    if (step === 3) return problems.length > 0;
    if (step === 4) return revenue.length > 0;
    if (step === 5) return contact.nome && contact.email;
    return false;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { businessName, businessType, problems, revenue }
      });
      if (error) throw error;
      const text = data?.plan || "Plano não disponível.";
      setPlanText(text);

      // Typewriter effect
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 15);

      // Save
      await supabase.from("plan_requests" as any).insert({
        nome: contact.nome, email: contact.email, telefone: contact.telefone,
        business_name: businessName, business_type: businessType,
        problems, revenue_range: revenue, plan_text: text,
      });
    } catch (err) {
      console.error(err);
      setPlanText("Erro ao gerar o plano. Por favor tenta novamente.");
      setDisplayedText("Erro ao gerar o plano. Por favor tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (planText) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
            <h1 className="font-display text-2xl text-foreground mb-2">O teu plano personalizado</h1>
            <p className="text-muted-foreground text-sm">{businessName} — {businessType}</p>
          </div>
          <div className="glass-card p-6 md:p-8 prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{displayedText}</pre>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 !px-6">
              <Download size={16} /> Descarregar PDF
            </button>
            <a href="/" className="px-6 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              Voltar ao site
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} /> Voltar
          </a>
          <h1 className="font-display text-3xl text-foreground mb-2">Plano Grátis Personalizado</h1>
          <p className="text-muted-foreground text-sm">5 passos rápidos para receberes o teu plano com IA</p>
        </div>

        <Progress value={step * 20} className="h-1.5" />

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {step === 1 && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-foreground font-medium">Qual é o nome do teu negócio?</h2>
                <input
                  value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="Ex: Restaurante O Manel"
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
              </div>
            )}

            {step === 2 && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-foreground font-medium">Que tipo de negócio tens?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => setBusinessType(t.label)}
                      className={`p-4 rounded-lg border text-sm text-left transition-all ${
                        businessType === t.label
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-foreground font-medium">Qual é o teu maior problema? (máx. 2)</h2>
                <div className="space-y-2">
                  {PROBLEMS.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleProblem(p)}
                      className={`w-full p-3 rounded-lg border text-sm text-left transition-all ${
                        problems.includes(p)
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {problems.includes(p) ? "☑" : "☐"} {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-foreground font-medium">Qual a tua faturação mensal?</h2>
                <div className="space-y-2">
                  {REVENUES.map(r => (
                    <button
                      key={r}
                      onClick={() => setRevenue(r)}
                      className={`w-full p-3 rounded-lg border text-sm text-left transition-all ${
                        revenue === r
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-foreground font-medium">Para onde enviamos o teu plano?</h2>
                <input
                  value={contact.nome} onChange={e => setContact(c => ({ ...c, nome: e.target.value }))}
                  placeholder="Nome *" required
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
                <input
                  type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                  placeholder="Email *" required
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
                <input
                  value={contact.telefone} onChange={e => setContact(c => ({ ...c, telefone: e.target.value }))}
                  placeholder="Telefone (opcional)"
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft size={16} /> Anterior
            </button>
          )}
          <div className="ml-auto">
            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-primary flex items-center gap-2 !px-6 disabled:opacity-40"
              >
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canNext() || loading}
                className="btn-primary flex items-center gap-2 !px-6 disabled:opacity-40"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> A gerar...</> : "Gerar o meu plano →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanoGratis;
