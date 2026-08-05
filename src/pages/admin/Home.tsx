import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useOs } from "@/components/admin/AdminLayout";
import { Panel, Skeleton, Label, HealthRing, severityColor } from "@/components/admin/os/Primitives";
import { ArrowUpRight, Loader2, Sparkles } from "lucide-react";

interface Signal { label: string; detail: string; severity: string; action: string }

const greeting = () => {
  const h = new Date().getHours();
  if (h < 13) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
};

const Home = () => {
  const os = useOs();
  const [briefing, setBriefing] = useState<{ headline: string; signals: Signal[] } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setAiLoading(true);
      const { data, error } = await supabase.functions.invoke("altus-intelligence", { body: { mode: "briefing" } });
      if (!alive) return;
      if (error || data?.erro) setAiError(error?.message ?? data?.erro);
      else setBriefing(data);
      setAiLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const stats = [
    { label: "Leads 30d", value: os.today.leads },
    { label: "Conversas hoje", value: os.today.conversations },
    { label: "Por responder", value: os.today.unanswered },
    { label: "MRR", value: `€${os.today.mrr.toLocaleString("pt-PT")}` },
    { label: "Clientes ativos", value: os.today.activeClients },
    { label: "Investimento 30d", value: `€${Math.round(os.today.spend30d)}` },
  ];

  const opportunities = briefing?.signals.length ?? os.notifications.length;

  return (
    <div className="space-y-8">
      {/* Command header */}
      <div className="os-glow -mx-5 lg:-mx-8 px-5 lg:px-8 pb-2">
        <motion.h1
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="text-[26px] sm:text-[32px] font-medium tracking-[-0.02em]"
        >
          {greeting()}, Pedro.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="os-dim mt-1.5 text-[15px]"
        >
          {aiLoading && !briefing
            ? "A analisar a operação…"
            : `Hoje existem ${opportunities} oportunidades para fazer a agência crescer.`}
        </motion.p>
      </div>

      {/* Compact stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-px rounded-2xl overflow-hidden" style={{ background: "var(--os-line)" }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 * i }}
            className="px-4 py-4"
            style={{ background: "var(--os-panel)" }}
          >
            <p className="os-label">{s.label}</p>
            <p className="text-[20px] mt-1.5 font-medium tracking-tight">
              {os.loading ? <Skeleton className="h-6 w-16" /> : s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* AI briefing */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Briefing do dia · gerado por IA</Label>
          <Link to="/admin/ia" className="text-xs os-dim hover:text-white transition-colors flex items-center gap-1">
            Painel de IA <ArrowUpRight size={12} />
          </Link>
        </div>

        {aiLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[62px] w-full !rounded-2xl" />)}
          </div>
        )}

        {aiError && (
          <Panel className="p-5">
            <p className="text-sm text-white/90">A IA não conseguiu gerar o briefing.</p>
            <p className="text-xs os-faint mt-1">{aiError}</p>
          </Panel>
        )}

        {briefing && (
          <div className="space-y-2">
            {briefing.signals.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
              >
                <Panel hover className="p-4 flex items-start gap-3.5 group">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: severityColor(s.severity) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-white">{s.label}</p>
                    <p className="text-[13px] os-dim mt-0.5 leading-relaxed">{s.detail}</p>
                  </div>
                  <span className="os-btn opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:inline-flex">
                    {s.action}
                  </span>
                </Panel>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Clients at a glance */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Health score dos clientes</Label>
          <Link to="/admin/clients" className="text-xs os-dim hover:text-white transition-colors flex items-center gap-1">
            Ver todos <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {os.loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[84px] !rounded-2xl" />)
            : os.clients.slice(0, 6).map((c) => (
                <Link key={c.id} to={`/admin/client/${c.id}`}>
                  <Panel hover className="p-4 flex items-center gap-4 h-full">
                    <HealthRing value={c.health} />
                    <div className="min-w-0">
                      <p className="text-[14px] truncate">{c.name}</p>
                      <p className="text-xs os-faint truncate">
                        {c.drivers.map((d) => `${d.label} ${d.value}`).slice(0, 2).join(" · ")}
                      </p>
                    </div>
                  </Panel>
                </Link>
              ))}
        </div>
      </section>

      {/* Ask */}
      <Panel className="p-5 flex items-center gap-4">
        <Sparkles size={16} style={{ color: "var(--os-accent)" }} />
        <p className="text-[13px] os-dim flex-1">
          Precisas de uma resposta rápida? Pergunta ao Altus sobre qualquer cliente, campanha ou número.
        </p>
        {aiLoading && <Loader2 size={14} className="animate-spin os-faint" />}
      </Panel>
    </div>
  );
};

export default Home;
