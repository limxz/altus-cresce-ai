import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Target, Trash2 } from "lucide-react";

const db = supabase as any;

interface Goal {
  id: string;
  label: string;
  metric: string;
  unit: string | null;
  target: number;
  current_value: number;
  deadline: string | null;
  status: string;
}

const FIELDS: { key: string; label: string; type?: "textarea" | "number" | "date" }[] = [
  { key: "trade_name", label: "Nome comercial" },
  { key: "legal_name", label: "Nome da empresa" },
  { key: "sector", label: "Setor" },
  { key: "subsector", label: "Subsetor" },
  { key: "location", label: "Localização" },
  { key: "service_area", label: "Área geográfica" },
  { key: "website_url", label: "Website" },
  { key: "instagram_url", label: "Instagram" },
  { key: "facebook_url", label: "Facebook" },
  { key: "tiktok_url", label: "TikTok" },
  { key: "google_business_url", label: "Google Business Profile" },
  { key: "phone", label: "Telefone" },
  { key: "email", label: "Email" },
  { key: "business_model", label: "Modelo de negócio" },
  { key: "average_ticket", label: "Ticket médio (€)", type: "number" },
  { key: "monthly_target", label: "Meta mensal (€)", type: "number" },
  { key: "tracking_start_date", label: "Início do acompanhamento", type: "date" },
  { key: "description", label: "Descrição", type: "textarea" },
  { key: "products_services", label: "Produtos / serviços", type: "textarea" },
  { key: "target_audience", label: "Público-alvo", type: "textarea" },
  { key: "primary_goal", label: "Objetivo principal", type: "textarea" },
];

/** Admin-side editor for the Business Profile and Goals that feed the AltusOS engine. */
const BusinessWorkspace = ({ clientId }: { clientId: string }) => {
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const notifyPortal = async () => {
    try {
      const channel = supabase.channel(`client:${clientId}`);
      await channel.subscribe();
      await channel.send({ type: "broadcast", event: "admin_update", payload: { at: new Date().toISOString() } });
      supabase.removeChannel(channel);
    } catch { /* realtime is a nicety, never a blocker */ }
  };

  const load = async () => {
    setLoading(true);
    const [clientRes, profileRes, goalsRes] = await Promise.all([
      db.from("clients").select("organization_id").eq("id", clientId).maybeSingle(),
      db.from("business_profiles").select("*").eq("client_id", clientId).maybeSingle(),
      db.from("business_goals").select("*").eq("client_id", clientId).order("created_at"),
    ]);
    setOrgId(clientRes.data?.organization_id ?? null);
    setProfile(profileRes.data ?? { client_id: clientId });
    setGoals((goalsRes.data ?? []) as Goal[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  const saveProfile = async () => {
    if (!orgId) return;
    setSaving(true);
    const payload = { ...profile, client_id: clientId, organization_id: orgId };
    delete payload.created_at;
    delete payload.updated_at;
    const { error } = await db.from("business_profiles").upsert(payload, { onConflict: "client_id" });
    if (error) toast({ title: "Não foi possível guardar", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Business Profile guardado", description: "O portal do cliente foi atualizado." });
      await db.from("activity_events").insert({
        organization_id: orgId, client_id: clientId, actor: "admin", entity: "business_profile",
        action: "updated", title: "Perfil do negócio atualizado pela equipa Altus",
      });
      await notifyPortal();
      await load();
    }
    setSaving(false);
  };

  const addGoal = async () => {
    if (!orgId) return;
    const { error } = await db.from("business_goals").insert({
      organization_id: orgId, client_id: clientId,
      label: "Novo objetivo", metric: "leads", target: 100, current_value: 0,
    });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { await notifyPortal(); await load(); }
  };

  const saveGoal = async (goal: Goal) => {
    const { error } = await db.from("business_goals").update({
      label: goal.label, metric: goal.metric, unit: goal.unit,
      target: Number(goal.target) || 0, current_value: Number(goal.current_value) || 0,
      deadline: goal.deadline || null,
    }).eq("id", goal.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      await db.from("goal_snapshots").upsert(
        { goal_id: goal.id, client_id: clientId, value: Number(goal.current_value) || 0 },
        { onConflict: "goal_id,date" },
      );
      toast({ title: "Objetivo guardado" });
      await notifyPortal();
    }
  };

  const removeGoal = async (id: string) => {
    await db.from("business_goals").delete().eq("id", id);
    await notifyPortal();
    await load();
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>Contexto que o AltusOS usa para analisar este negócio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.filter((f) => f.type !== "textarea").map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={profile?.[f.key] ?? ""}
                  onChange={(e) => setProfile((p: any) => ({ ...p, [f.key]: e.target.value || null }))}
                />
              </div>
            ))}
          </div>
          {FIELDS.filter((f) => f.type === "textarea").map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Textarea
                rows={2}
                value={profile?.[f.key] ?? ""}
                onChange={(e) => setProfile((p: any) => ({ ...p, [f.key]: e.target.value || null }))}
              />
            </div>
          ))}
          <Button onClick={saveProfile} disabled={saving || !orgId}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar perfil
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Objetivos visíveis no portal do cliente.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addGoal}><Plus className="mr-1.5 h-3.5 w-3.5" /> Novo</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem objetivos definidos para este cliente.</p>
          )}
          {goals.map((g, i) => (
            <div key={g.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={g.label}
                  onChange={(e) => setGoals((list) => list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <Button size="icon" variant="ghost" onClick={() => removeGoal(g.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1"><Label className="text-xs">Métrica</Label>
                  <Input value={g.metric} onChange={(e) => setGoals((l) => l.map((x, j) => (j === i ? { ...x, metric: e.target.value } : x)))} /></div>
                <div className="space-y-1"><Label className="text-xs">Alvo</Label>
                  <Input type="number" value={g.target} onChange={(e) => setGoals((l) => l.map((x, j) => (j === i ? { ...x, target: Number(e.target.value) } : x)))} /></div>
                <div className="space-y-1"><Label className="text-xs">Atual</Label>
                  <Input type="number" value={g.current_value} onChange={(e) => setGoals((l) => l.map((x, j) => (j === i ? { ...x, current_value: Number(e.target.value) } : x)))} /></div>
                <div className="space-y-1"><Label className="text-xs">Prazo</Label>
                  <Input type="date" value={g.deadline ?? ""} onChange={(e) => setGoals((l) => l.map((x, j) => (j === i ? { ...x, deadline: e.target.value } : x)))} /></div>
              </div>
              <Button size="sm" variant="outline" onClick={() => saveGoal(goals[i])}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> Guardar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessWorkspace;
