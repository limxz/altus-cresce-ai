import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOs } from "@/components/admin/AdminLayout";
import { Panel, Skeleton, Label } from "@/components/admin/os/Primitives";

interface Row {
  client_id: string;
  spend: number; impressions: number; clicks: number;
  conversions: number; messages: number;
}

const MetaAds = () => {
  const os = useOs();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("ad_metrics")
        .select("client_id, spend, impressions, clicks, conversions, messages_started")
        .gte("date", since);
      const map = new Map<string, Row>();
      (data ?? []).forEach((d) => {
        const r = map.get(d.client_id) ?? { client_id: d.client_id, spend: 0, impressions: 0, clicks: 0, conversions: 0, messages: 0 };
        r.spend += Number(d.spend ?? 0);
        r.impressions += d.impressions ?? 0;
        r.clicks += d.clicks ?? 0;
        r.conversions += d.conversions ?? 0;
        r.messages += d.messages_started ?? 0;
        map.set(d.client_id, r);
      });
      setRows([...map.values()].sort((a, b) => b.spend - a.spend));
      setLoading(false);
    })();
  }, []);

  const nameOf = (id: string) => os.clients.find((c) => c.id === id)?.name ?? "Cliente";

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[22px] font-medium tracking-[-0.02em]">Meta Ads</h1>
        <p className="os-dim text-[14px] mt-1">Performance agregada dos últimos 30 dias, por cliente.</p>
      </header>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 !rounded-2xl" />)}</div>
      ) : rows.length === 0 ? (
        <Panel className="p-6">
          <p className="text-sm">Sem dados de campanhas.</p>
          <p className="text-xs os-faint mt-1">
            A sincronização diária (06:00) preenche esta vista assim que a Meta Marketing API estiver ligada e cada cliente tiver
            <span className="text-white/80"> meta_ad_account_id</span> definido.
          </p>
        </Panel>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const ctr = r.impressions ? (r.clicks / r.impressions) * 100 : 0;
            const cpc = r.clicks ? r.spend / r.clicks : 0;
            const cpa = r.conversions ? r.spend / r.conversions : 0;
            const cpm = r.impressions ? (r.spend / r.impressions) * 1000 : 0;
            const cells = [
              { l: "Investido", v: `€${r.spend.toFixed(0)}` },
              { l: "CTR", v: `${ctr.toFixed(2)}%` },
              { l: "CPC", v: `€${cpc.toFixed(2)}` },
              { l: "CPM", v: `€${cpm.toFixed(2)}` },
              { l: "CPA", v: cpa ? `€${cpa.toFixed(2)}` : "—" },
              { l: "Conversas", v: r.messages },
            ];
            return (
              <Panel key={r.client_id} hover className="p-4">
                <p className="text-[14px] mb-3">{nameOf(r.client_id)}</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {cells.map((c) => (
                    <div key={c.l}>
                      <Label>{c.l}</Label>
                      <p className="text-[15px] mt-1">{c.v}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MetaAds;
