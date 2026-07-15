import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Star, Loader2 } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  quote: string;
  rating: number;
  avatar_url: string | null;
  display_order: number;
  active: boolean;
}

const emptyForm: Omit<Testimonial, "id"> = {
  name: "",
  role: "",
  company: "",
  quote: "",
  rating: 5,
  avatar_url: "",
  display_order: 0,
  active: true,
};

const db = supabase as any;

const Testimonials = () => {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await db
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    else setItems((data ?? []) as Testimonial[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      role: t.role ?? "",
      company: t.company ?? "",
      quote: t.quote,
      rating: t.rating,
      avatar_url: t.avatar_url ?? "",
      display_order: t.display_order,
      active: t.active,
    });
    setOpen(true);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("proofs").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("proofs").getPublicUrl(path);
      setForm((f) => ({ ...f, avatar_url: data.publicUrl }));
      toast({ title: "Foto carregada" });
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.quote.trim()) {
      toast({ title: "Nome e testemunho são obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      role: form.role || null,
      company: form.company || null,
      quote: form.quote,
      rating: Number(form.rating) || 5,
      avatar_url: form.avatar_url || null,
      display_order: Number(form.display_order) || 0,
      active: form.active,
    };
    const { error } = editingId
      ? await db.from("testimonials").update(payload).eq("id", editingId)
      : await db.from("testimonials").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao gravar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Testemunho atualizado" : "Testemunho criado" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar este testemunho?")) return;
    const { error } = await db.from("testimonials").delete().eq("id", id);
    if (error) return toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
    toast({ title: "Testemunho apagado" });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-foreground" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Testemunhos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gere os testemunhos apresentados na homepage.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Novo Testemunho
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={16} /> A carregar...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground">
          Ainda não tens testemunhos. Cria o primeiro.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t.id} className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-foreground text-sm font-medium truncate">{t.name}</div>
                    <div className="text-muted-foreground text-xs truncate">
                      {[t.role, t.company].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed line-clamp-4">"{t.quote}"</p>
              {!t.active && (
                <span className="text-[0.625rem] uppercase text-muted-foreground">Inativo</span>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar testemunho" : "Novo testemunho"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cargo</Label>
                <Input value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex: CEO" />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Ex: Gracie Barra" />
              </div>
            </div>
            <div>
              <Label>Testemunho *</Label>
              <Textarea rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
            </div>
            <div>
              <Label>Foto (opcional)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading && <Loader2 size={16} className="animate-spin" />}
              </div>
              {form.avatar_url && (
                <img src={form.avatar_url} alt="preview" className="mt-2 w-16 h-16 rounded-full object-cover" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Avaliação</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col justify-end pb-1">
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
              Gravar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Testimonials;
