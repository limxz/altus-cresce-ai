import { useState } from "react";
import { HubSnapshot, openDocument } from "@/hooks/useClientHub";
import { Panel, SectionTitle, Empty, Pill, fmtDate } from "./HubUI";
import { FileText, Download, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CATEGORIES: Record<string, string> = {
  relatorio: "Relatório",
  proposta: "Proposta",
  contrato: "Contrato",
  fatura: "Fatura",
  criativo: "Criativo",
};

const DocumentsModule = ({ data, session }: { data: HubSnapshot; session: string | null }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("todos");

  const docs = data.documents ?? [];
  const visible = docs.filter((d: any) => filter === "todos" || d.category === filter);
  const cats = Array.from(new Set(docs.map((d: any) => d.category)));

  const open = async (doc: any) => {
    setBusy(doc.id);
    try {
      const url = await openDocument(data.client.id, session, doc.id);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast({ title: "Não foi possível abrir", description: (e as Error).message, variant: "destructive" });
    }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Documentos"
        hint="Relatórios, propostas, contratos e criativos partilhados pela equipa"
        action={
          cats.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {["todos", ...cats].map((c) => (
                <button key={c} onClick={() => setFilter(c)} className="os-btn !px-2.5 text-xs"
                  style={filter === c ? { borderColor: "var(--os-accent)", color: "#fff" } : undefined}>
                  {c === "todos" ? "Todos" : CATEGORIES[c] ?? c}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      <Panel>
        {visible.length === 0 ? (
          <Empty title="Sem documentos" hint="Quando a equipa partilhar relatórios ou propostas, ficam disponíveis aqui para download." />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--os-line)" }}>
            {visible.map((d: any) => (
              <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                <FileText size={16} className="shrink-0" style={{ color: "var(--os-accent)" }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-medium truncate">{d.title}</p>
                    <Pill>{CATEGORIES[d.category] ?? d.category}</Pill>
                  </div>
                  {d.description && <p className="text-xs os-dim mt-0.5 line-clamp-1">{d.description}</p>}
                  <p className="text-xs os-faint mt-0.5">{fmtDate(d.created_at)}</p>
                </div>
                <button onClick={() => open(d)} disabled={busy === d.id} className="os-btn shrink-0">
                  {d.external_url ? <ExternalLink size={13} /> : <Download size={13} />}
                  {busy === d.id ? "A abrir…" : "Abrir"}
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
};

export default DocumentsModule;
