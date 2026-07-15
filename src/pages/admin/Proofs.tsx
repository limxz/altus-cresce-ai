import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Star, Loader2, Upload } from "lucide-react";

type ProofType =
  | "screenshot"
  | "video"
  | "testemunho"
  | "dashboard"
  | "conversa"
  | "outro";

interface Proof {
  id: string;
  type: ProofType;
  title: string;
  description: string | null;
  media_url: string | null;
  client_name: string | null;
  display_order: number;
  featured: boolean;
  active: boolean;
}

const emptyForm: Omit<Proof, "id"> = {
  type: "screenshot",
  title: "",
  description: "",
  media_url: "",
  client_name: "",
  display_order: 0,
  featured: false,
  active: true,
};

const Proofs = () => {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("proofs")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar provas", description: error.message, variant: "destructive" });
    } else {
      setProofs((data ?? []) as Proof[]);
    }
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

  const openEdit = (p: Proof) => {
    setEditingId(p.id);
    setForm({
      type: p.type,
      title: p.title,
      description: p.description ?? "",
      media_url: p.media_url ?? "",
      client_name: p.client_name ?? "",
      display_order: p.display_order,
      featured: p.featured,
      active: p.active,
    });
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("proofs").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("proofs").getPublicUrl(path);
      setForm((f) => ({ ...f, media_url: data.publicUrl }));
      toast({ title: "Ficheiro carregado" });
    } catch (e: any) {
      toast({ title: "Erro ao carregar", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      type: form.type,
      title: form.title,
      description: form.description || null,
      media_url: form.media_url || null,
      client_name: form.client_name || null,
      display_order: Number(form.display_order) || 0,
      featured: form.featured,
      active: form.active,
    };
    const { error } = editingId
      ? await supabase.from("proofs").update(payload).eq("id", editingId)
      : await supabase.from("proofs").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao gravar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editingId ? "Prova atualizada" : "Prova criada" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Apagar esta prova?")) return;
    const { error } = await supabase.from("proofs").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao apagar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Prova apagada" });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-foreground" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            Provas Reais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Screenshots, vídeos, testemunhos e dashboards para mostrar na homepage.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Nova Prova
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={16} /> A carregar...
        </div>
      ) : proofs.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground">
          Ainda não tens provas. Cria a primeira.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofs.map((p) => (
            <div key={p.id} className="glass-card p-4 flex flex-col gap-3">
              {p.media_url && (
                <div className="rounded-lg overflow-hidden bg-black/40 aspect-video flex items-center justify-center">
                  {p.type === "video" ? (
                    <video src={p.media_url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={p.media_url} alt={p.title} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[0.625rem] font-mono uppercase tracking-widest text-accent">{p.type}</span>
                    {p.featured && <Star size={12} className="text-accent fill-accent" />}
                    {!p.active && <span className="text-[0.625rem] uppercase text-muted-foreground">Inativa</span>}
                  </div>
                  <h3 className="font-display text-foreground text-sm truncate">{p.title}</h3>
                  {p.client_name && (
                    <p className="text-xs text-muted-foreground truncate">{p.client_name}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              {p.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar prova" : "Nova prova"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ProofType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="screenshot">Screenshot</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="testemunho">Testemunho</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="conversa">Conversa</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={form.client_name ?? ""} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Ex: Gracie Barra" />
            </div>
            <div>
              <Label>Ficheiro (imagem ou vídeo)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  disabled={uploading}
                />
                {uploading && <Loader2 size={16} className="animate-spin" />}
              </div>
              {form.media_url && (
                <div className="mt-2 rounded-lg overflow-hidden bg-black/40 aspect-video">
                  {form.type === "video" ? (
                    <video src={form.media_url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={form.media_url} alt="preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <Input
                className="mt-2"
                placeholder="Ou cola um URL"
                value={form.media_url ?? ""}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <div className="flex items-center justify-between">
                  <Label>Destaque</Label>
                  <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                </div>
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

export default Proofs;
