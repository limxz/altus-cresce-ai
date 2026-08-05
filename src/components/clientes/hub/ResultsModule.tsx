import { HubSnapshot } from "@/hooks/useClientHub";
import { KpiCard, Panel, SectionTitle, Empty, money, fmtDate } from "./HubUI";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Euro, MousePointerClick, Target, Instagram } from "lucide-react";

const axis = { stroke: "#5b616e", fontSize: 11 };
const tooltipStyle = {
  background: "#111113",
  border: "1px solid rgba(255,255,255,.09)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

const ResultsModule = ({ data }: { data: HubSnapshot }) => {
  const ads = (data.ads.series ?? []).map((r: any) => ({
    date: fmtDate(r.date),
    investimento: Number(r.spend ?? 0),
    cliques: Number(r.clicks ?? 0),
    conversoes: Number(r.conversions ?? 0),
    ctr: r.impressions ? Number(((r.clicks / r.impressions) * 100).toFixed(2)) : 0,
  }));

  const ig = (data.instagram.series ?? []).map((r: any) => ({
    date: fmtDate(r.date),
    seguidores: r.followers_count ?? 0,
    engagement: r.engagement_rate ?? 0,
    alcance: r.reach ?? 0,
  }));

  const hasAds = ads.length > 0;
  const hasIg = ig.length > 0;

  const signupSeries = (data.signups?.series ?? []).map((r) => ({
    date: fmtDate(r.date),
    inscricoes: r.count,
  }));
  const hasSignups = (data.signups?.total ?? 0) > 0;

  return (
    <div className="space-y-8">
      <section className={`grid grid-cols-2 gap-3 ${hasSignups ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {hasSignups && (
          <KpiCard label="Inscrições (7 dias)" value={data.signups!.last7} delta={data.signups!.delta} icon={ClipboardCheck}
            hint={`${data.signups!.total} no total dos últimos 60 dias`} />
        )}
        <KpiCard label="Investimento (7 dias)" value={money(data.ads.spend)} delta={null} icon={Euro} />
        <KpiCard label="CTR" value={data.ads.ctr} unit="%" delta={data.ads.ctrDelta} icon={MousePointerClick}
          hint="Percentagem de pessoas que clicam depois de ver" />
        <KpiCard label="Custo por conversão" value={data.ads.cpa ? money(data.ads.cpa) : null} delta={data.ads.cpaDelta} invertDelta icon={Target} />
        <KpiCard label="Seguidores Instagram" value={data.instagram.followers} delta={null} icon={Instagram}
          hint={data.instagram.followersDelta != null ? `${data.instagram.followersDelta >= 0 ? "+" : ""}${data.instagram.followersDelta} nos últimos 7 dias` : undefined} />
      </section>

      {hasSignups && (
        <section>
          <SectionTitle title="Inscrições" hint="Inscrições recebidas do teu site, dia a dia (últimos 30 dias)" />
          <Panel className="p-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={signupSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="date" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="inscricoes" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </section>
      )}


      <section>
        <SectionTitle title="Investimento e conversões" hint="Últimos 60 dias de campanhas" />
        <Panel className="p-4">
          {!hasAds ? (
            <Empty title="Sem dados de campanhas" hint="Assim que a conta de anúncios estiver ligada, o desempenho diário aparece aqui." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ads}>
                <defs>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                <Area type="monotone" dataKey="investimento" stroke="#7c3aed" fill="url(#gInv)" strokeWidth={2} />
                <Area type="monotone" dataKey="conversoes" stroke="#34d399" fill="url(#gConv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <Panel className="p-4">
          <SectionTitle title="Crescimento no Instagram" />
          {!hasIg ? (
            <Empty title="Sem dados de Instagram" hint="Liga a conta Instagram Business para veres o crescimento diário." />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={ig}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" {...axis} tickLine={false} axisLine={false} />
                <YAxis yAxisId="r" orientation="right" {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                <Line yAxisId="l" type="monotone" dataKey="seguidores" stroke="#2d9cff" strokeWidth={2} dot={false} />
                <Line yAxisId="r" type="monotone" dataKey="engagement" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel className="p-4">
          <SectionTitle title="Cliques por dia" />
          {!hasAds ? (
            <Empty title="Sem dados" hint="Os cliques aparecem assim que as campanhas estiverem ligadas." />
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={ads}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,.04)" }} />
                <Bar dataKey="cliques" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      {data.reports.length > 0 && (
        <section>
          <SectionTitle title="Relatórios executivos" hint="Resumo do período preparado automaticamente" />
          <div className="space-y-3">
            {data.reports.map((r: any) => (
              <Panel key={r.id} className="p-4">
                <p className="text-xs os-faint">{fmtDate(r.period_start)} — {fmtDate(r.period_end)}</p>
                <p className="text-[13px] mt-2 leading-relaxed os-dim">{r.summary}</p>
                {(r.actions ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {(r.actions as any[]).slice(0, 4).map((a, i) => (
                      <li key={i} className="text-xs os-dim flex gap-2">
                        <span style={{ color: "var(--os-accent)" }}>→</span>
                        {typeof a === "string" ? a : a.title ?? JSON.stringify(a)}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResultsModule;
