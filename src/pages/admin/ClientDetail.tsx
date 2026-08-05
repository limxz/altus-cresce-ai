import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";
import AddMetricsModal from "@/components/admin/AddMetricsModal";
import ClientPortalManager from "@/components/admin/ClientPortalManager";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const db = supabase as any;

interface InstagramMetric {
  date: string;
  followers_count: number | null;
  engagement_rate: number | null;
}

interface PostMetric {
  script_structure: string | null;
  reach: number | null;
}

interface Recommendation {
  title: string;
  description: string;
  priority: "alta" | "media" | "baixa" | string;
  category: string;
}

interface RecommendationRow {
  id: string;
  summary: string | null;
  recommendations: Recommendation[] | null;
  period_start: string | null;
  period_end: string | null;
  generated_at: string;
}

const priorityStyles: Record<string, { card: string; badge: string; label: string }> = {
  alta: {
    card: "border-destructive/50 bg-destructive/5",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    label: "Alta",
  },
  media: {
    card: "border-yellow-500/50 bg-yellow-500/5",
    badge: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    label: "Média",
  },
  baixa: {
    card: "border-emerald-500/50 bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    label: "Baixa",
  },
};

const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  color: "hsl(var(--foreground))",
};

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [igMetrics, setIgMetrics] = useState<InstagramMetric[]>([]);
  const [postMetrics, setPostMetrics] = useState<PostMetric[]>([]);
  const [latestRec, setLatestRec] = useState<RecommendationRow | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000);
    const periodStart = start.toISOString().split("T")[0];
    const periodEnd = end.toISOString().split("T")[0];

    const [clientRes, igRes, postRes, recRes] = await Promise.all([
      db.from("clients").select("business_name").eq("id", id).maybeSingle(),
      db
        .from("instagram_metrics")
        .select("date, followers_count, engagement_rate")
        .eq("client_id", id)
        .gte("date", periodStart)
        .lte("date", periodEnd)
        .order("date", { ascending: true }),
      db
        .from("post_metrics")
        .select("script_structure, reach")
        .eq("client_id", id)
        .gte("posted_at", start.toISOString()),
      db
        .from("ai_recommendations")
        .select("*")
        .eq("client_id", id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const firstError = clientRes.error || igRes.error || postRes.error || recRes.error;
    if (firstError) {
      toast({ title: "Erro ao carregar dados", description: firstError.message, variant: "destructive" });
    }

    setClientName(clientRes.data?.business_name ?? "Cliente");
    setIgMetrics((igRes.data ?? []) as InstagramMetric[]);
    setPostMetrics((postRes.data ?? []) as PostMetric[]);
    setLatestRec((recRes.data ?? null) as RecommendationRow | null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const followersData = useMemo(
    () =>
      igMetrics.map((m) => ({
        date: new Date(m.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
        seguidores: m.followers_count ?? 0,
        engagement: m.engagement_rate != null ? Number(m.engagement_rate) : 0,
      })),
    [igMetrics],
  );

  const reachByStructure = useMemo(() => {
    const groups: Record<string, { total: number; count: number }> = {};
    for (const p of postMetrics) {
      const key = p.script_structure || "sem estrutura";
      if (!groups[key]) groups[key] = { total: 0, count: 0 };
      groups[key].total += p.reach ?? 0;
      groups[key].count += 1;
    }
    return Object.entries(groups)
      .map(([estrutura, { total, count }]) => ({
        estrutura,
        reach_medio: Math.round(total / count),
        posts: count,
      }))
      .sort((a, b) => b.reach_medio - a.reach_medio);
  }, [postMetrics]);

  const sortedRecommendations = useMemo(() => {
    const list = latestRec?.recommendations ?? [];
    return [...list].sort(
      (a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9),
    );
  }, [latestRec]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    const { error } = await supabase.functions.invoke("generate-recommendations", {
      body: { client_id: id },
    });
    if (error) {
      toast({ title: "Erro ao gerar recomendações", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recomendações geradas com sucesso" });
      await load();
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin/clients" aria-label="Voltar aos clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{clientName}</h1>
            <p className="text-sm text-muted-foreground">Desempenho dos últimos 30 dias</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setMetricsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar métricas
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Gerar recomendações IA
          </Button>
        </div>
      </div>

      {id && (
        <AddMetricsModal
          clientId={id}
          open={metricsOpen}
          onOpenChange={setMetricsOpen}
          onSaved={load}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seguidores e engagement rate</CardTitle>
          </CardHeader>
          <CardContent>
            {followersData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Sem métricas de Instagram nos últimos 30 dias.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={followersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="seguidores"
                    name="Seguidores"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement (%)"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alcance médio por estrutura de guião</CardTitle>
          </CardHeader>
          <CardContent>
            {reachByStructure.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Sem posts registados nos últimos 30 dias.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reachByStructure}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="estrutura" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar
                    dataKey="reach_medio"
                    name="Alcance médio"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Recomendações da IA</h2>
          {latestRec && (
            <span className="text-xs text-muted-foreground">
              Gerado a {new Date(latestRec.generated_at).toLocaleString("pt-PT")}
              {latestRec.period_start && latestRec.period_end
                ? ` · período ${latestRec.period_start} a ${latestRec.period_end}`
                : ""}
            </span>
          )}
        </div>

        {latestRec?.summary && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">{latestRec.summary}</CardContent>
          </Card>
        )}

        {sortedRecommendations.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Ainda não existem recomendações para este cliente.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedRecommendations.map((rec, index) => {
              const style = priorityStyles[rec.priority] ?? priorityStyles.baixa;
              return (
                <Card key={`${rec.title}-${index}`} className={`border ${style.card}`}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${style.badge}`}
                      >
                        Prioridade {style.label}
                      </span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {rec.category}
                      </span>
                    </div>
                    <CardTitle className="pt-2 text-base">{rec.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{rec.description}</CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {id && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Inscrições de sites externos</h2>
            <ExternalSignups clientId={id} clientName={clientName} />
          </section>
        )}

        {id && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">Portal do cliente</h2>
            <p className="text-sm text-muted-foreground">
              O que partilhas aqui aparece imediatamente no painel do cliente.
            </p>
            <ClientPortalManager clientId={id} />
          </section>
        )}
      </div>
    </div>

  );
};

export default ClientDetail;
