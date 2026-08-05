import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useOs } from "@/components/admin/AdminLayout";
import { Panel, Skeleton, Label, severityColor, HealthRing } from "@/components/admin/os/Primitives";
import { RefreshCw, Wand2, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  client_id: string;
  summary: string | null;
  highlights: string[] | null;
  risks: string[] | null;
  created_at: string;
  source: string;
}

interface Rec {
  id: string;
  client_id: string;
  summary: string | null;
  recommendations: { title: string; description: string; priority: string; category: string }[] | null;
  generated_at: string;
}

const PRIORITY = { alta: "critico", media: "atencao", baixa: "oportunidade" } as const;

const Intelligence = () => {
  const os = useOs();
  const { toast } = useToast();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("ai_recommendations")
      .select("id, client_id, summary, recommendations, generated_at")
      .order("generated_at", { ascending: false })
      .limit(30);
    setRecs((data ?? []) as unknown as Rec[]);
    const { data: rep } = await supabase
      .from("client_reports")
      .select("id, client_id, summary, highlights, risks, created_at, source")
      .order("created_at", { ascending: false })
      .limit(10);
    setReports((rep ?? []) as unknown as Report[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = async (clientId: string, name: string) => {
    setRunning(clientId);
    const { error } = await supabase.functions.invoke("generate-recommendations", { body: { client_id: clientId } });
    setRunning(null);
    if (error) toast({ title: "Falhou", description: error.message, variant: "destructive" });
    else { toast({ title: "Análise concluída", description: `Novas recomendações para ${name}.` }); load(); }
  };

  const nameOf = (id: string) => os.clients.find((c) => c.id === id)?.name ?? "Cliente";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[22px] font-medium tracking-[-0.02em]">Inteligência</h1>
        <p className="os-dim text-[14px] mt-1">
          A IA lê métricas de Instagram, anúncios, conversas e pipeline e devolve o que fazer a seguir.
        </p>
      </header>

      <section className="space-y-3">
        <Label>Analisar cliente</Label>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {os.loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[76px] !rounded-2xl" />)
            : os.clients.map((c) => (
                <Panel key={c.id} hover className="p-4 flex items-center gap-3.5">
                  <HealthRing value={c.health} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] truncate">{c.name}</p>
                    <p className="text-xs os-faint truncate">{c.niche ?? "—"}</p>
                  </div>
                  <button
                    onClick={() => generate(c.id, c.name)}
                    disabled={running === c.id}
                    className="os-btn shrink-0"
                  >
                    {running === c.id ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
                  </button>
                </Panel>
              ))}
        </div>
      </section>

      <section className="space-y-3">
        <Label>Relatórios executivos automáticos</Label>
        {loading ? (
          <Skeleton className="h-[110px] !rounded-2xl" />
        ) : reports.length === 0 ? (
          <Panel className="p-5">
            <p className="text-sm">Ainda não há relatórios automáticos.</p>
            <p className="text-xs os-faint mt-1">
              São gerados sozinhos depois de cada sincronização de integrações com dados reais.
            </p>
          </Panel>
        ) : (
          <div className="space-y-2">
            {reports.map((rep) => (
              <Panel key={rep.id} className="p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <Link to={`/admin/client/${rep.client_id}`} className="text-[14px] hover:opacity-80 flex items-center gap-1">
                    {nameOf(rep.client_id)} <ArrowUpRight size={12} />
                  </Link>
                  <span className="text-[11px] os-faint">
                    {new Date(rep.created_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {rep.source}
                  </span>
                </div>
                {rep.summary && <p className="text-[13px] os-dim leading-relaxed">{rep.summary}</p>}
                {(rep.highlights?.length || rep.risks?.length) && (
                  <div className="grid gap-2 md:grid-cols-2 mt-3">
                    {(rep.highlights ?? []).map((h, i) => (
                      <p key={`h${i}`} className="text-xs os-dim flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: severityColor("oportunidade") }} />{h}
                      </p>
                    ))}
                    {(rep.risks ?? []).map((r, i) => (
                      <p key={`r${i}`} className="text-xs os-dim flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: severityColor("critico") }} />{r}
                      </p>
                    ))}
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Label>Recomendações recentes</Label>
        {loading ? (
          <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-[120px] !rounded-2xl" />)}</div>
        ) : recs.length === 0 ? (
          <Panel className="p-6">
            <p className="text-sm">Ainda não há análises.</p>
            <p className="text-xs os-faint mt-1">Escolhe um cliente acima e corre a análise.</p>
          </Panel>
        ) : (
          <div className="space-y-3">
            {recs.map((r, idx) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                <Panel className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <Link to={`/admin/client/${r.client_id}`} className="text-[14px] hover:opacity-80 flex items-center gap-1">
                      {nameOf(r.client_id)} <ArrowUpRight size={12} />
                    </Link>
                    <span className="text-[11px] os-faint">
                      {new Date(r.generated_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                  {r.summary && <p className="text-[13px] os-dim leading-relaxed mb-4">{r.summary}</p>}
                  <div className="grid gap-2 md:grid-cols-2">
                    {(r.recommendations ?? []).map((rec, i) => {
                      const color = severityColor(PRIORITY[rec.priority as keyof typeof PRIORITY] ?? "info");
                      return (
                        <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,.025)", border: "1px solid var(--os-line)" }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                            <span className="text-[13px]">{rec.title}</span>
                            <span className="ml-auto text-[10px] os-faint uppercase tracking-wider">{rec.category}</span>
                          </div>
                          <p className="text-xs os-dim leading-relaxed">{rec.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Intelligence;
