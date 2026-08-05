import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Copy, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const db = supabase as any;

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  color: "hsl(var(--foreground))",
};

interface TokenRow {
  id: string;
  label: string;
  token_prefix: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

interface SignupRow {
  id: string;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  occurred_at: string;
}

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-signups`;

const randomToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `als_${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
};

const sha256 = async (value: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
      {label}
    </Button>
  );
};

const ExternalSignups = ({ clientId, clientName }: { clientId: string; clientName: string }) => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("Site externo");
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const [tokenRes, signupRes] = await Promise.all([
      db
        .from("client_webhook_tokens")
        .select("id, label, token_prefix, revoked_at, last_used_at, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      db
        .from("external_signups")
        .select("id, source, name, email, phone, occurred_at")
        .eq("client_id", clientId)
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false }),
    ]);
    setTokens((tokenRes.data ?? []) as TokenRow[]);
    setSignups((signupRes.data ?? []) as SignupRow[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`signups-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "external_signups", filter: `client_id=eq.${clientId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, load]);

  const series = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) map.set(dateKey(new Date(Date.now() - i * 86400000)), 0);
    for (const s of signups) {
      const key = s.occurred_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].map(([date, inscricoes]) => ({
      date: new Date(date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
      inscricoes,
    }));
  }, [signups]);

  const last7 = useMemo(() => {
    const cut = new Date(Date.now() - 7 * 86400000).toISOString();
    return signups.filter((s) => s.occurred_at >= cut).length;
  }, [signups]);

  const activeToken = tokens.find((t) => !t.revoked_at) ?? null;

  const createToken = async () => {
    setCreating(true);
    const { data: client, error: clientError } = await db
      .from("clients")
      .select("organization_id")
      .eq("id", clientId)
      .maybeSingle();
    if (clientError || !client?.organization_id) {
      toast({ title: "Erro", description: clientError?.message ?? "Cliente sem organização", variant: "destructive" });
      setCreating(false);
      return;
    }
    const token = randomToken();
    const { error } = await db.from("client_webhook_tokens").insert({
      client_id: clientId,
      organization_id: client.organization_id,
      label: label.trim() || "Site externo",
      token_prefix: token.slice(0, 12),
      token_hash: await sha256(token),
    });
    if (error) {
      toast({ title: "Erro ao criar ligação", description: error.message, variant: "destructive" });
    } else {
      setNewToken(token);
      toast({ title: "Ligação criada", description: "Copia o token agora — não volta a ser mostrado." });
      await load();
    }
    setCreating(false);
  };

  const revoke = async (id: string) => {
    const { error } = await db
      .from("client_webhook_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao revogar", description: error.message, variant: "destructive" });
      return;
    }
    setNewToken(null);
    toast({ title: "Ligação revogada" });
    await load();
  };

  const snippet = `await fetch("${ENDPOINT}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    token: "${newToken ?? "O_TEU_TOKEN"}",
    source: "site",
    name: nome,
    email: email,
    phone: telefone,
  }),
});`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Inscrições (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{last7}</p>
            <p className="mt-1 text-xs text-muted-foreground">{signups.length} nos últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução de inscrições</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-[180px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : signups.length === 0 ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Ainda sem inscrições recebidas deste site.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="inscricoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" /> Fontes externas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Liga o site de {clientName} ao Altus. Cada inscrição feita lá aparece automaticamente aqui e no painel do cliente.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nome da ligação (ex.: Site Gracie Barra)"
              className="max-w-xs"
            />
            <Button onClick={createToken} disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Criar ligação
            </Button>
          </div>

          {newToken && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <p className="text-sm font-medium">Token gerado — copia agora</p>
              <p className="mt-1 break-all font-mono text-xs">{newToken}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value={newToken} label="Copiar token" />
                <CopyButton value={ENDPOINT} label="Copiar endpoint" />
                <CopyButton value={snippet} label="Copiar código" />
              </div>
            </div>
          )}

          {tokens.length > 0 && (
            <div className="divide-y rounded-lg border">
              {tokens.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.token_prefix}… ·{" "}
                      {t.revoked_at
                        ? "revogada"
                        : t.last_used_at
                          ? `última inscrição ${new Date(t.last_used_at).toLocaleString("pt-PT")}`
                          : "ainda sem inscrições"}
                    </p>
                  </div>
                  {!t.revoked_at && (
                    <Button variant="ghost" size="sm" onClick={() => revoke(t.id)}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Revogar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-sm font-medium">Código a colar no outro site</p>
            <p className="mb-2 text-xs text-muted-foreground">
              Adiciona isto ao formulário de inscrição do outro projeto, depois de guardar a inscrição lá.
            </p>
            <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs">
              <code>{snippet}</code>
            </pre>
            <div className="mt-2 flex gap-2">
              <CopyButton value={snippet} label="Copiar código" />
              <CopyButton value={ENDPOINT} label="Copiar endpoint" />
            </div>
            {!activeToken && !newToken && (
              <p className="mt-2 text-xs text-muted-foreground">
                Cria uma ligação acima para obteres o token a usar no código.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {signups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas inscrições</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {signups.slice(0, 10).map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{s.name ?? s.email ?? s.phone ?? "Inscrição"}</span>
                <span className="text-xs text-muted-foreground">
                  {s.source} · {new Date(s.occurred_at).toLocaleString("pt-PT")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExternalSignups;
