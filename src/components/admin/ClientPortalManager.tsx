import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText, Trash2, Upload } from "lucide-react";

const db = supabase as any;

const CATEGORIES = ["relatorio", "proposta", "contrato", "fatura", "criativo"];

interface Props {
  clientId: string;
}

/** Admin manager for what the client sees in the portal: documents and meetings. */
const ClientPortalManager = ({ clientId }: Props) => {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const [docForm, setDocForm] = useState({ title: "", description: "", category: "relatorio", external_url: "" });
  const [meetForm, setMeetForm] = useState({ title: "", scheduled_at: "", duration_minutes: 30, location: "", notes: "" });

  const load = useCallback(async () => {
    const [{ data: client }, { data: d }, { data: m }] = await Promise.all([
      db.from("clients").select("organization_id").eq("id", clientId).maybeSingle(),
      db.from("client_documents").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      db.from("client_meetings").select("*").eq("client_id", clientId).order("scheduled_at", { ascending: false }),
    ]);
    setOrgId(client?.organization_id ?? null);
    setDocs(d ?? []);
    setMeetings(m ?? []);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const addDocument = async (file?: File) => {
    if (!orgId) return;
    if (!docForm.title && !file) return toast({ title: "Indica um título", variant: "destructive" });
    setUploading(true);

    let file_path: string | null = null;
    if (file) {
      file_path = `${clientId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("client-documents").upload(file_path, file);
      if (error) {
        setUploading(false);
        return toast({ title: "Upload falhou", description: error.message, variant: "destructive" });
      }
    }

    const { error } = await db.from("client_documents").insert({
      organization_id: orgId,
      client_id: clientId,
      title: docForm.title || file?.name || "Documento",
      description: docForm.description || null,
      category: docForm.category,
      external_url: docForm.external_url || null,
      file_path,
      mime_type: file?.type ?? null,
      size_bytes: file?.size ?? null,
    });
    setUploading(false);
    if (error) return toast({ title: "Não foi possível guardar", description: error.message, variant: "destructive" });
    setDocForm({ title: "", description: "", category: "relatorio", external_url: "" });
    toast({ title: "Documento partilhado com o cliente" });
    load();
  };

  const removeDocument = async (id: string) => {
    await db.from("client_documents").delete().eq("id", id);
    load();
  };

  const addMeeting = async () => {
    if (!orgId) return;
    if (!meetForm.title || !meetForm.scheduled_at) {
      return toast({ title: "Título e data são obrigatórios", variant: "destructive" });
    }
    const { error } = await db.from("client_meetings").insert({
      organization_id: orgId,
      client_id: clientId,
      title: meetForm.title,
      scheduled_at: new Date(meetForm.scheduled_at).toISOString(),
      duration_minutes: Number(meetForm.duration_minutes) || 30,
      location: meetForm.location || null,
      notes: meetForm.notes || null,
    });
    if (error) return toast({ title: "Não foi possível agendar", description: error.message, variant: "destructive" });
    setMeetForm({ title: "", scheduled_at: "", duration_minutes: 30, location: "", notes: "" });
    toast({ title: "Reunião agendada" });
    load();
  };

  const removeMeeting = async (id: string) => {
    await db.from("client_meetings").delete().eq("id", id);
    load();
  };

  const input = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={16} /> Documentos do cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input className={input} placeholder="Título" value={docForm.title}
            onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} />
          <input className={input} placeholder="Descrição (opcional)" value={docForm.description}
            onChange={(e) => setDocForm({ ...docForm, description: e.target.value })} />
          <div className="flex gap-2">
            <select className={input} value={docForm.category}
              onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={input} placeholder="Link externo (opcional)" value={docForm.external_url}
              onChange={(e) => setDocForm({ ...docForm, external_url: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <label className="inline-flex">
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && addDocument(e.target.files[0])} />
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <Upload size={14} /> {uploading ? "A carregar…" : "Carregar ficheiro"}
              </span>
            </label>
            <Button variant="secondary" onClick={() => addDocument()} disabled={uploading}>
              Guardar link
            </Button>
          </div>

          <div className="divide-y divide-border">
            {docs.length === 0 && <p className="py-3 text-sm text-muted-foreground">Sem documentos partilhados.</p>}
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1 truncate">{d.title} <span className="text-muted-foreground">· {d.category}</span></span>
                <button onClick={() => removeDocument(d.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays size={16} /> Reuniões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input className={input} placeholder="Título da reunião" value={meetForm.title}
            onChange={(e) => setMeetForm({ ...meetForm, title: e.target.value })} />
          <div className="flex gap-2">
            <input type="datetime-local" className={input} value={meetForm.scheduled_at}
              onChange={(e) => setMeetForm({ ...meetForm, scheduled_at: e.target.value })} />
            <input type="number" className={input} value={meetForm.duration_minutes} min={15} step={15}
              onChange={(e) => setMeetForm({ ...meetForm, duration_minutes: Number(e.target.value) })} />
          </div>
          <input className={input} placeholder="Local ou link da videochamada" value={meetForm.location}
            onChange={(e) => setMeetForm({ ...meetForm, location: e.target.value })} />
          <input className={input} placeholder="Notas visíveis para o cliente" value={meetForm.notes}
            onChange={(e) => setMeetForm({ ...meetForm, notes: e.target.value })} />
          <Button onClick={addMeeting}>Agendar reunião</Button>

          <div className="divide-y divide-border">
            {meetings.length === 0 && <p className="py-3 text-sm text-muted-foreground">Sem reuniões agendadas.</p>}
            {meetings.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1 truncate">
                  {m.title}{" "}
                  <span className="text-muted-foreground">
                    · {new Date(m.scheduled_at).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </span>
                <button onClick={() => removeMeeting(m.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortalManager;
