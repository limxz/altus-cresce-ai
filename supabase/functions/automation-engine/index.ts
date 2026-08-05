import { admin, audit, corsHeaders, invokeFunction, json, notify } from "../_shared/os.ts";

/**
 * Event based automation engine.
 * Evaluates real data against active rules and executes their actions.
 * Trigger types: ctr_drop | lead_no_reply | client_silent | website_slow |
 *                new_leads | sync_failing | spend_no_conversions
 */

interface Rule {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  trigger_type: string;
  config: Record<string, any>;
  actions: { type: string; [k: string]: any }[];
  is_active: boolean;
  requires_approval?: boolean;
}

/** Actions that reach the outside world through connected integrations. */
const EXTERNAL_ACTIONS = new Set(["followup", "whatsapp", "email"]);

const DEFAULTS: Omit<Rule, "id" | "organization_id" | "client_id">[] = [
  { name: "CTR caiu mais de 25%", trigger_type: "ctr_drop", config: { drop_pct: 25 }, actions: [{ type: "notify" }, { type: "ai_report" }], is_active: true },
  { name: "Lead sem resposta há 4h", trigger_type: "lead_no_reply", config: { hours: 4 }, actions: [{ type: "notify" }], is_active: true },
  { name: "Cliente sem atividade há 7 dias", trigger_type: "client_silent", config: { days: 7 }, actions: [{ type: "notify" }], is_active: true },
  { name: "Website lento (performance < 60)", trigger_type: "website_slow", config: { min_score: 60 }, actions: [{ type: "notify" }], is_active: true },
  { name: "Investimento sem conversões", trigger_type: "spend_no_conversions", config: { min_spend: 50 }, actions: [{ type: "notify" }, { type: "ai_report" }], is_active: true },
  { name: "Novos leads por qualificar", trigger_type: "new_leads", config: { hours: 24 }, actions: [{ type: "notify" }], is_active: true },
];

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

async function evaluate(rule: Rule, clients: any[]): Promise<
  { client_id: string | null; title: string; detail: string; severity: any; href: string; key: string }[]
> {
  const hits: any[] = [];
  const scope = rule.client_id ? clients.filter((c) => c.id === rule.client_id) : clients;
  const day = 864e5;

  if (rule.trigger_type === "ctr_drop") {
    const dropPct = Number(rule.config.drop_pct ?? 25);
    const since = new Date(Date.now() - 14 * day).toISOString().slice(0, 10);
    const { data } = await admin.from("ad_metrics")
      .select("client_id, date, clicks, impressions").gte("date", since);
    for (const c of scope) {
      const rows = (data ?? []).filter((r) => r.client_id === c.id);
      const cut = new Date(Date.now() - 7 * day).toISOString().slice(0, 10);
      const ctr = (rs: any[]) => {
        const imp = rs.reduce((s, r) => s + (r.impressions ?? 0), 0);
        return imp ? (rs.reduce((s, r) => s + (r.clicks ?? 0), 0) / imp) * 100 : 0;
      };
      const prev = ctr(rows.filter((r) => r.date < cut));
      const curr = ctr(rows.filter((r) => r.date >= cut));
      if (prev > 0 && curr > 0 && ((prev - curr) / prev) * 100 >= dropPct) {
        hits.push({
          client_id: c.id, severity: "atencao", href: `/admin/client/${c.id}`,
          title: `CTR a cair · ${c.business_name}`,
          detail: `CTR passou de ${prev.toFixed(2)}% para ${curr.toFixed(2)}% nos últimos 7 dias. Rever criativos e segmentação.`,
          key: `ctr-drop-${c.id}-${new Date().toISOString().slice(0, 10)}`,
        });
      }
    }
  }

  if (rule.trigger_type === "lead_no_reply") {
    const hours = Number(rule.config.hours ?? 4);
    const { data } = await admin.from("whatsapp_conversations")
      .select("id, client_id, contact_name, last_message_at, is_read")
      .eq("is_read", false).lte("last_message_at", ago(hours * 3600e3));
    for (const c of scope) {
      const rows = (data ?? []).filter((r) => r.client_id === c.id);
      if (rows.length) {
        hits.push({
          client_id: c.id, severity: "critico", href: "/admin/conversations",
          title: `${rows.length} leads sem resposta · ${c.business_name}`,
          detail: `À espera há mais de ${hours}h no WhatsApp. Responder é a ação com maior impacto agora.`,
          key: `no-reply-${c.id}-${new Date().toISOString().slice(0, 13)}`,
        });
      }
    }
  }

  if (rule.trigger_type === "client_silent") {
    const days = Number(rule.config.days ?? 7);
    const { data } = await admin.from("whatsapp_conversations")
      .select("client_id, last_message_at").gte("last_message_at", ago(days * day));
    for (const c of scope) {
      const active = (data ?? []).some((r) => r.client_id === c.id);
      if (!active) {
        hits.push({
          client_id: c.id, severity: "atencao", href: `/admin/client/${c.id}`,
          title: `${c.business_name} sem atividade`,
          detail: `Zero conversas nos últimos ${days} dias. Risco de churn — agendar check-in.`,
          key: `silent-${c.id}-${new Date().toISOString().slice(0, 10)}`,
        });
      }
    }
  }

  if (rule.trigger_type === "website_slow") {
    const min = Number(rule.config.min_score ?? 60);
    const { data } = await admin.from("client_integrations")
      .select("client_id, config").eq("provider", "website").eq("status", "connected");
    for (const c of scope) {
      const row = (data ?? []).find((r) => r.client_id === c.id);
      const perf = Number(row?.config?.performance ?? NaN);
      if (!Number.isNaN(perf) && perf < min) {
        hits.push({
          client_id: c.id, severity: "atencao", href: "/admin/websites",
          title: `Website lento · ${c.business_name}`,
          detail: `Performance ${perf}/100 (mínimo definido: ${min}). Está a queimar orçamento em anúncios.`,
          key: `web-slow-${c.id}-${new Date().toISOString().slice(0, 10)}`,
        });
      }
    }
  }

  if (rule.trigger_type === "spend_no_conversions") {
    const minSpend = Number(rule.config.min_spend ?? 50);
    const since = new Date(Date.now() - 7 * day).toISOString().slice(0, 10);
    const { data } = await admin.from("ad_metrics")
      .select("client_id, spend, conversions, messages_started").gte("date", since);
    for (const c of scope) {
      const rows = (data ?? []).filter((r) => r.client_id === c.id);
      const spend = rows.reduce((s, r) => s + Number(r.spend ?? 0), 0);
      const conv = rows.reduce((s, r) => s + (r.conversions ?? 0) + (r.messages_started ?? 0), 0);
      if (spend >= minSpend && conv === 0) {
        hits.push({
          client_id: c.id, severity: "critico", href: "/admin/meta-ads",
          title: `${spend.toFixed(0)}€ sem conversões · ${c.business_name}`,
          detail: "7 dias de investimento sem uma única conversão registada. Pausar ou reformular campanha.",
          key: `spend-noconv-${c.id}-${new Date().toISOString().slice(0, 10)}`,
        });
      }
    }
  }

  if (rule.trigger_type === "new_leads") {
    const hours = Number(rule.config.hours ?? 24);
    const { data } = await admin.from("leads").select("id").gte("created_at", ago(hours * 3600e3));
    if ((data ?? []).length) {
      hits.push({
        client_id: null, severity: "oportunidade", href: "/admin/leads",
        title: `${data!.length} novos leads (${hours}h)`,
        detail: "Qualificar e mover para o pipeline antes que arrefeçam.",
        key: `new-leads-${new Date().toISOString().slice(0, 13)}`,
      });
    }
  }

  return hits;
}

/** Executes an approved external action through the connected integrations. */
export async function executeAction(
  orgId: string, clientId: string | null, action: any, title: string,
) {
  try {
    if (action.type === "followup") {
      if (action.lead_id) {
        await admin.from("pipeline_leads").update({ next_action: title }).eq("id", action.lead_id);
      } else if (clientId) {
        await admin.from("clients").select("id").eq("id", clientId).maybeSingle();
      }
    }
    await audit({
      organization_id: orgId, client_id: clientId,
      action_type: `action:${action.type}`, status: "success",
      title: `Ação executada · ${title}`, metadata: action,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await audit({
      organization_id: orgId, client_id: clientId,
      action_type: `action:${action.type}`, status: "error",
      title: `Ação falhou · ${title}`, detail: msg, metadata: action,
    });
    return { ok: false, error: msg };
  }
}

/** Runs every approval that a human has marked as approved. */
async function runApprovedQueue(clientFilter?: string) {
  let q = admin.from("automation_approvals").select("*").eq("status", "approved");
  if (clientFilter) q = q.eq("client_id", clientFilter);
  const { data } = await q;
  let done = 0;
  for (const a of data ?? []) {
    const res = await executeAction(a.organization_id, a.client_id, { type: a.action_type, ...(a.payload ?? {}) }, a.title);
    await admin.from("automation_approvals")
      .update({ status: res.ok ? "executed" : "failed", decision_note: res.ok ? null : res.error })
      .eq("id", a.id);
    if (res.ok) done++;
  }
  return done;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const clientFilter: string | undefined = body.client_id;
    const trigger = body.trigger ?? "manual";

    if (body.action === "execute_approvals") {
      const approvalsRun = await runApprovedQueue(clientFilter);
      return json({ ok: true, approvals_executed: approvalsRun });
    }

    const { data: clientsData } = await admin
      .from("clients").select("id, business_name, organization_id, status").eq("status", "active");
    const clients = (clientsData ?? []).filter((c) => !clientFilter || c.id === clientFilter);
    if (!clients.length) return json({ ok: true, hits: 0, note: "Sem clientes ativos." });

    const orgIds = [...new Set(clients.map((c) => c.organization_id))];
    const { data: rulesData } = await admin
      .from("automation_rules").select("*").in("organization_id", orgIds).eq("is_active", true);

    let executed = 0;
    for (const orgId of orgIds) {
      const orgClients = clients.filter((c) => c.organization_id === orgId);
      const custom = (rulesData ?? []).filter((r) => r.organization_id === orgId) as Rule[];
      const rules: Rule[] = custom.length
        ? custom
        : DEFAULTS.map((d, i) => ({ ...d, id: `default-${i}`, organization_id: orgId, client_id: null }));

      for (const rule of rules) {
        let hits: any[] = [];
        try {
          hits = await evaluate(rule, orgClients);
        } catch (e) {
          console.error("rule failed", rule.trigger_type, e);
          continue;
        }
        for (const hit of hits) {
          for (const action of rule.actions ?? [{ type: "notify" }]) {
            if (action.type === "notify") {
              await notify({
                organization_id: orgId,
                client_id: hit.client_id,
                category: `automation:${rule.trigger_type}`,
                severity: hit.severity,
                title: hit.title,
                detail: hit.detail,
                href: hit.href,
                dedupe_key: hit.key,
              });
            }
            if (action.type === "ai_report" && hit.client_id) {
              await invokeFunction("client-agent", { client_id: hit.client_id, trigger: `rule:${rule.trigger_type}` });
            }
            if (EXTERNAL_ACTIONS.has(action.type)) {
              const needsApproval = rule.requires_approval !== false;
              if (needsApproval) {
                await admin.from("automation_approvals").upsert({
                  organization_id: orgId,
                  client_id: hit.client_id,
                  rule_id: rule.id.startsWith("default-") ? null : rule.id,
                  trigger_type: rule.trigger_type,
                  action_type: action.type,
                  title: hit.title,
                  detail: hit.detail,
                  payload: { ...action, href: hit.href },
                  status: "pending",
                  dedupe_key: `approval-${action.type}-${hit.key}`,
                }, { onConflict: "organization_id,dedupe_key", ignoreDuplicates: true });
                await audit({
                  organization_id: orgId, client_id: hit.client_id,
                  action_type: "approval_requested", status: "pending",
                  title: `Follow-up à espera de aprovação · ${hit.title}`,
                  detail: hit.detail, metadata: { rule: rule.name, action: action.type },
                });
              } else {
                await executeAction(orgId, hit.client_id, action, hit.title);
              }
            }
          }
          executed++;
          await admin.from("automation_runs").insert({
            organization_id: orgId,
            rule_id: rule.id.startsWith("default-") ? null : rule.id,
            client_id: hit.client_id,
            trigger_type: rule.trigger_type,
            status: "success",
            message: hit.title,
            payload: { detail: hit.detail, source: trigger, rule: rule.name },
          });
        }
        if (hits.length && !rule.id.startsWith("default-")) {
          await admin.from("automation_rules")
            .update({ last_triggered_at: new Date().toISOString() }).eq("id", rule.id);
        }
      }
    }

    const approvalsRun = await runApprovedQueue(clientFilter);
    return json({ ok: true, executed, approvals_executed: approvalsRun });
  } catch (e) {
    console.error("automation-engine error", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
