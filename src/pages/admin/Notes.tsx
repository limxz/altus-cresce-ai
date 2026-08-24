import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Panel, EmptyHint } from "@/components/admin/os/Primitives";
import { Plus, Search, Pin, PinOff, Trash2, Save, StickyNote } from "lucide-react";

interface NoteRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientLite {
  id: string;
  business_name: string;
}

const Notes = () => {
  const { toast } = useToast();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; content: string; client_id: string }>({
    title: "",
    content: "",
    client_id: "",
  });

  const load = async () => {
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .limit(1)
      .maybeSingle();
    const org = (member as any)?.organization_id ?? null;
    setOrgId(org);

    const [{ data: n }, { data: c }] = await Promise.all([
      supabase
        .from("client_notes" as any)
        .select("*")
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false }),
      supabase.from("clients" as any).select("id, business_name").order("business_name"),
    ]);
    setNotes((n as any) ?? []);
    setClients((c as any) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setDraft({ title: selected.title, content: selected.content, client_id: selected.client_id ?? "" });
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    let list = notes;
    if (clientFilter !== "all") {
      list = list.filter((n) => (clientFilter === "none" ? !n.client_id : n.client_id === clientFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    return list;
  }, [notes, search, clientFilter]);

  const clientName = (id: string | null) =>
    id ? clients.find((c) => c.id === id)?.business_name ?? "Cliente" : "Geral";

  const createNote = async () => {
    if (!orgId) {
      toast({ title: "Organização não encontrada", variant: "destructive" });
      return;
    }
    const { data, error } = await supabase
      .from("client_notes" as any)
      .insert({ organization_id: orgId, title: "Nova nota", content: "" } as any)
      .select("*")
      .single();
    if (error) {
      toast({ title: "Não foi possível criar", description: error.message, variant: "destructive" });
      return;
    }
    setNotes((p) => [data as any, ...p]);
    setSelectedId((data as any).id);
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    const payload = {
      title: draft.title.trim() || "Sem título",
      content: draft.content,
      client_id: draft.client_id || null,
    };
    const { error } = await supabase.from("client_notes" as any).update(payload as any).eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
      return;
    }
    setNotes((p) =>
      p.map((n) => (n.id === selected.id ? { ...n, ...payload, updated_at: new Date().toISOString() } : n))
    );
    toast({ title: "Nota guardada" });
  };

  const togglePin = async (note: NoteRow) => {
    const pinned = !note.pinned;
    await supabase.from("client_notes" as any).update({ pinned } as any).eq("id", note.id);
    setNotes((p) =>
      [...p.map((n) => (n.id === note.id ? { ...n, pinned } : n))].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at)
      )
    );
  };

  const removeNote = async (id: string) => {
    await supabase.from("client_notes" as any).delete().eq("id", id);
    setNotes((p) => p.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-medium tracking-tight">Anotações</h1>
          <p className="text-xs os-faint mt-0.5">Notas livres por cliente ou gerais da operação</p>
        </div>
        <button onClick={createNote} className="os-btn os-btn-accent">
          <Plus size={13} /> Nova nota
        </button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <Panel className="p-3 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 os-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar notas..."
              className="os-input w-full !pl-9"
            />
          </div>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="os-input w-full">
            <option value="all">Todos os clientes</option>
            <option value="none">Notas gerais</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name}
              </option>
            ))}
          </select>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto os-scroll">
            {loading ? (
              <p className="text-xs os-faint px-2 py-6 text-center">A carregar...</p>
            ) : filtered.length === 0 ? (
              <EmptyHint title="Sem notas" hint="Cria a primeira anotação para começar." />
            ) : (
              filtered.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className="w-full text-left rounded-lg px-3 py-2.5 transition-colors"
                  style={{
                    background: selectedId === n.id ? "rgba(255,255,255,.06)" : "transparent",
                    border: "1px solid var(--os-line)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    {n.pinned && <Pin size={11} className="shrink-0" style={{ color: "var(--os-amber)" }} />}
                    <span className="text-[13px] truncate">{n.title || "Sem título"}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] os-faint truncate">{clientName(n.client_id)}</span>
                    <span className="text-[10px] os-faint ml-auto">
                      {new Date(n.updated_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Panel>

        <Panel className="p-4">
          {!selected ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center">
              <StickyNote size={22} className="os-faint mb-2" />
              <p className="text-sm">Seleciona ou cria uma nota</p>
              <p className="text-xs os-faint mt-1">Escreve à vontade — texto livre, sem limites.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Título da nota"
                  className="os-input flex-1 !text-[14px]"
                />
                <select
                  value={draft.client_id}
                  onChange={(e) => setDraft({ ...draft, client_id: e.target.value })}
                  className="os-input sm:w-[220px]"
                >
                  <option value="">Nota geral</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="Escreve aqui..."
                className="os-input w-full min-h-[45vh] resize-y leading-relaxed"
              />

              <div className="flex items-center gap-2">
                <button onClick={saveNote} disabled={saving} className="os-btn os-btn-accent">
                  <Save size={13} /> {saving ? "A guardar..." : "Guardar"}
                </button>
                <button onClick={() => togglePin(selected)} className="os-btn">
                  {selected.pinned ? <PinOff size={13} /> : <Pin size={13} />}
                  {selected.pinned ? "Remover destaque" : "Destacar"}
                </button>
                <button onClick={() => removeNote(selected.id)} className="os-btn ml-auto" style={{ color: "var(--os-red)" }}>
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default Notes;
