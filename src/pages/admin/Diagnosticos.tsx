import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Eye, X, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Diagnostico {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  instagram_url: string;
  setor: string;
  score: number;
  contactado: boolean;
  diagnostico_json: any;
}

const Stars = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={12} className={i <= count ? "fill-primary text-primary" : "text-muted-foreground/30"} />
    ))}
  </div>
);

const DiagnosticoModal = ({ data, onClose }: { data: any; onClose: () => void }) => {
  if (!data) return null;
  const sections = [
    { title: "Presença Online", key: "presenca_online" },
    { title: "Comunicação e Conteúdo", key: "comunicacao_conteudo" },
    { title: "Atendimento ao Cliente", key: "atendimento_cliente" },
    { title: "Publicidade", key: "publicidade" },
    { title: "Site e Conversão", key: "site_conversao" },
  ];

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Score */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">{data.nome_negocio}</p>
        <div className="relative w-24 h-24 mx-auto mb-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(data.score / 100) * 327} 327`} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-display font-bold text-foreground">{data.score}</span>
        </div>
      </div>

      {sections.map(({ title, key }) => {
        const s = data[key];
        if (!s) return null;
        return (
          <div key={key} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <Stars count={s.nota} />
            </div>
            <p className="text-xs text-muted-foreground">{s.analise}</p>
            <div className="bg-primary/10 border border-primary/20 rounded-md p-2">
              <p className="text-xs text-foreground">💡 {s.melhoria}</p>
            </div>
          </div>
        );
      })}

      {data.top_3_prioridades && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">🎯 Top 3 Prioridades</h4>
          {data.top_3_prioridades.map((p: string, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
              <p className="text-xs text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>
      )}

      {data.conclusao && (
        <div className="glass-card p-4 border-primary/30">
          <h4 className="text-sm font-semibold text-foreground mb-1">📋 Conclusão</h4>
          <p className="text-xs text-muted-foreground">{data.conclusao}</p>
        </div>
      )}
    </div>
  );
};

const Diagnosticos = () => {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiag, setSelectedDiag] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDiagnosticos = async () => {
    const { data } = await supabase
      .from("diagnosticos" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDiagnosticos(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchDiagnosticos();
  }, []);

  const toggleContactado = async (id: string, current: boolean) => {
    await supabase
      .from("diagnosticos" as any)
      .update({ contactado: !current } as any)
      .eq("id", id);
    setDiagnosticos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, contactado: !current } : d))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Diagnósticos ({diagnosticos.length})
        </h2>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Instagram</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Setor</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Score</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Contactado</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {diagnosticos.map((d) => (
                <tr key={d.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-4 py-3 text-foreground">{d.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.email}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    <a href={d.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]">
                      {d.instagram_url.replace("https://instagram.com/", "@").replace("https://www.instagram.com/", "@")}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d.setor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={d.score} className="w-16 h-1.5" />
                      <span className="text-foreground font-medium">{d.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleContactado(d.id, d.contactado)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        d.contactado
                          ? "bg-green-500/20 text-green-400"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.contactado ? "Sim" : "Não"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedDiag(d.diagnostico_json);
                        setModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:text-secondary transition-colors"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
              {diagnosticos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum diagnóstico ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display">Diagnóstico Completo</DialogTitle>
          </DialogHeader>
          <DiagnosticoModal data={selectedDiag} onClose={() => setModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Diagnosticos;
