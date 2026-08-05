import { useOs } from "@/components/admin/AdminLayout";
import { Panel, Skeleton, Label } from "@/components/admin/os/Primitives";
import { Globe, Gauge, Search } from "lucide-react";

const Websites = () => {
  const os = useOs();

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[22px] font-medium tracking-[-0.02em]">Websites</h1>
        <p className="os-dim text-[14px] mt-1">
          Performance, SEO e Core Web Vitals por cliente — alimentado pelas fontes ligadas.
        </p>
      </header>

      <Panel className="p-5 flex items-start gap-3.5">
        <Gauge size={16} style={{ color: "var(--os-accent)" }} className="mt-0.5" />
        <div>
          <p className="text-[14px]">Monitorização automática por ligar</p>
          <p className="text-[13px] os-dim mt-1 leading-relaxed">
            Assim que os domínios dos clientes forem registados, esta vista mostra LCP, CLS, INP, tempo de carregamento,
            indexação e conversões — sem inserção manual.
          </p>
        </div>
      </Panel>

      <section className="space-y-3">
        <Label>Clientes monitorizados</Label>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {os.loading
            ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[76px] !rounded-2xl" />)
            : os.clients.map((c) => (
                <Panel key={c.id} hover className="p-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,.04)" }}>
                    <Globe size={15} className="os-dim" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] truncate">{c.name}</p>
                    <p className="text-xs os-faint">Sem domínio associado</p>
                  </div>
                  <Search size={14} className="os-faint" />
                </Panel>
              ))}
        </div>
      </section>
    </div>
  );
};

export default Websites;
