import { admin, corsHeaders, json, verifyClientSession } from "../_shared/os.ts";

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const dateAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const sum = (rows: any[], k: string) => rows.reduce((s, r) => s + num(r[k]), 0);
const pct = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

async function snapshot(clientId: string) {
  const { data: client } = await admin
    .from("clients")
    .select(
      "id, business_name, contact_name, niche, plan, status, logo_url, brand_color, start_date, organization_id, instagram_handle",
    )
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return null;

  const [
    ig,
    ads,
    posts,
    metrics,
    convos,
    recs,
    reports,
    integrations,
    docs,
    meetings,
    notifications,
    auditRows,
    syncRows,
    automationRows,
    memory,
    signups,
  ] = await Promise.all([
    admin.from("instagram_metrics").select("*").eq("client_id", clientId).gte("date", dateAgo(60)).order("date"),
    admin.from("ad_metrics").select("*").eq("client_id", clientId).gte("date", dateAgo(60)).order("date"),
    admin.from("post_metrics").select("*").eq("client_id", clientId).order("posted_at", { ascending: false }).limit(30),
    admin.from("metrics").select("*").eq("client_id", clientId).order("date", { ascending: false }).limit(2),
    admin
      .from("whatsapp_conversations")
      .select("id, contact_name, contact_phone, lead_status, urgency, sentiment, primary_need, last_message, last_message_at, started_at, status, tags")
      .eq("client_id", clientId)
      .order("last_message_at", { ascending: false })
      .limit(40),
    admin.from("ai_recommendations").select("*").eq("client_id", clientId).order("generated_at", { ascending: false }).limit(3),
    admin.from("client_reports").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(3),
    admin.from("client_integrations").select("id, provider, status, display_name, config, last_sync_at, last_error").eq("client_id", clientId),
    admin.from("client_documents").select("*").eq("client_id", clientId).eq("visible_to_client", true).order("created_at", { ascending: false }),
    admin.from("client_meetings").select("*").eq("client_id", clientId).eq("visible_to_client", true).order("scheduled_at", { ascending: false }).limit(20),
    admin.from("notifications").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(30),
    admin.from("audit_log").select("*").eq("client_id", clientId).gte("created_at", daysAgo(14)).order("created_at", { ascending: false }).limit(60),
    admin.from("integration_sync_runs").select("*").eq("client_id", clientId).gte("created_at", daysAgo(14)).order("created_at", { ascending: false }).limit(40),
    admin.from("automation_runs").select("*").eq("client_id", clientId).gte("created_at", daysAgo(14)).order("created_at", { ascending: false }).limit(40),
    admin.from("client_memory").select("*").eq("client_id", clientId).maybeSingle(),
    admin
      .from("external_signups")
      .select("id, source, name, email, phone, occurred_at")
      .eq("client_id", clientId)
      .gte("occurred_at", daysAgo(60))
      .order("occurred_at", { ascending: false }),
  ]);


  const igRows = ig.data ?? [];
  const adRows = ads.data ?? [];
  const convoRows = convos.data ?? [];

  const last7 = adRows.filter((r: any) => r.date >= dateAgo(7));
  const prev7 = adRows.filter((r: any) => r.date >= dateAgo(14) && r.date < dateAgo(7));

  const spend7 = sum(last7, "spend");
  const clicks7 = sum(last7, "clicks");
  const impr7 = sum(last7, "impressions");
  const conv7 = sum(last7, "conversions");
  const spendPrev = sum(prev7, "spend");
  const clicksPrev = sum(prev7, "clicks");
  const imprPrev = sum(prev7, "impressions");
  const convPrev = sum(prev7, "conversions");

  const ctr = impr7 ? Number(((clicks7 / impr7) * 100).toFixed(2)) : null;
  const ctrPrev = imprPrev ? (clicksPrev / imprPrev) * 100 : 0;
  const cpa = conv7 ? Number((spend7 / conv7).toFixed(2)) : null;
  const cpaPrev = convPrev ? spendPrev / convPrev : 0;
  const cpm = impr7 ? Number(((spend7 / impr7) * 1000).toFixed(2)) : null;

  const leads7 = convoRows.filter((c: any) => c.started_at && c.started_at >= daysAgo(7)).length;
  const leadsPrev = convoRows.filter(
    (c: any) => c.started_at && c.started_at >= daysAgo(14) && c.started_at < daysAgo(7),
  ).length;

  const website = (integrations.data ?? []).find((i: any) => i.provider === "website");
  const activeIntegrations = (integrations.data ?? []).filter((i: any) => i.status === "connected");

  const upcomingMeetings = (meetings.data ?? []).filter(
    (m: any) => new Date(m.scheduled_at).getTime() > Date.now() && m.status !== "cancelada",
  );

  const igLast = igRows[igRows.length - 1] ?? null;
  const igWeekAgo = igRows.find((r: any) => r.date >= dateAgo(7)) ?? igRows[0] ?? null;

  const latestMetric: any = (metrics.data ?? [])[0] ?? null;

  const healthParts: number[] = [];
  if (website?.config?.performance != null) healthParts.push(num(website.config.performance));
  if (ctr != null) healthParts.push(Math.min(100, ctr * 25));
  if (leads7) healthParts.push(Math.min(100, leads7 * 10));
  if (igLast?.engagement_rate != null) healthParts.push(Math.min(100, num(igLast.engagement_rate) * 20));
  const health = latestMetric?.health_score ??
    (healthParts.length ? Math.round(healthParts.reduce((a, b) => a + b, 0) / healthParts.length) : null);

  const timeline = [
    ...((auditRows.data ?? []) as any[]).map((x) => ({
      id: `a-${x.id}`,
      at: x.created_at,
      kind: x.action_type,
      status: x.status,
      title: x.title,
      detail: x.detail,
    })),
    ...((syncRows.data ?? []) as any[]).map((x) => ({
      id: `s-${x.id}`,
      at: x.created_at,
      kind: "sync",
      status: x.status,
      title: `Dados de ${String(x.provider).replace("_", " ")} atualizados`,
      detail: x.message,
    })),
    ...((automationRows.data ?? []) as any[]).map((x) => ({
      id: `r-${x.id}`,
      at: x.created_at,
      kind: `automation:${x.trigger_type}`,
      status: x.status,
      title: x.message ?? x.trigger_type,
      detail: (x.payload as any)?.detail ?? null,
    })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 60);

  const signupRows = (signups.data ?? []) as any[];
  const signups7 = signupRows.filter((s) => s.occurred_at >= daysAgo(7)).length;
  const signupsPrev = signupRows.filter(
    (s) => s.occurred_at >= daysAgo(14) && s.occurred_at < daysAgo(7),
  ).length;
  const signupsByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) signupsByDay.set(dateAgo(i), 0);
  for (const s of signupRows) {
    const d = String(s.occurred_at).slice(0, 10);
    if (signupsByDay.has(d)) signupsByDay.set(d, (signupsByDay.get(d) ?? 0) + 1);
  }

  return {
    client,
    memory: memory.data ?? null,
    kpis: {
      signups: { value: signups7, delta: pct(signups7, signupsPrev) },
      leads: { value: leads7, delta: pct(leads7, leadsPrev) },
      conversions: { value: conv7, delta: pct(conv7, convPrev) },
      meetings: { value: upcomingMeetings.length, delta: null },
      campaigns: { value: activeIntegrations.length, delta: null },
      spend: { value: Number(spend7.toFixed(2)), delta: pct(spend7, spendPrev) },
      website: { value: website?.config?.performance ?? null, delta: null },
      health: { value: health, delta: null },
    },
    ads: {
      series: adRows,
      ctr,
      ctrDelta: ctrPrev ? Math.round(((ctr! - ctrPrev) / ctrPrev) * 100) : null,
      cpa,
      cpaDelta: cpaPrev && cpa ? Math.round(((cpa - cpaPrev) / cpaPrev) * 100) : null,
      cpm,
      spend: Number(spend7.toFixed(2)),
      conversions: conv7,
      impressions: impr7,
      clicks: clicks7,
    },
    instagram: {
      series: igRows,
      followers: igLast?.followers_count ?? null,
      followersDelta: igLast && igWeekAgo ? num(igLast.followers_count) - num(igWeekAgo.followers_count) : null,
      engagement: igLast?.engagement_rate ?? null,
      posts: posts.data ?? [],
    },
    website: website
      ? {
        url: website.config?.url ?? null,
        performance: website.config?.performance ?? null,
        seo: website.config?.seo ?? null,
        accessibility: website.config?.accessibility ?? null,
        best_practices: website.config?.best_practices ?? null,
        lcp: website.config?.lcp ?? null,
        cls: website.config?.cls ?? null,
        tbt: website.config?.tbt ?? null,
        measured_at: website.config?.measured_at ?? website.last_sync_at ?? null,
        status: website.status,
      }
      : null,
    integrations: (integrations.data ?? []).map((i: any) => ({
      id: i.id,
      provider: i.provider,
      status: i.status,
      display_name: i.display_name,
      last_sync_at: i.last_sync_at,
    })),
    leads: convoRows,
    signups: {
      total: signupRows.length,
      last7: signups7,
      delta: pct(signups7, signupsPrev),
      recent: signupRows.slice(0, 20),
      series: [...signupsByDay.entries()].map(([date, count]) => ({ date, count })),
    },
    recommendations: recs.data ?? [],
    reports: reports.data ?? [],
    documents: docs.data ?? [],
    meetings: meetings.data ?? [],
    notifications: notifications.data ?? [],
    timeline,
  };
}

async function briefing(snap: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;

  const facts = {
    negocio: snap.client.business_name,
    nicho: snap.client.niche,
    leads_7d: snap.kpis.leads.value,
    inscricoes_7d: snap.signups?.last7 ?? null,
    inscricoes_variacao_pct: snap.signups?.delta ?? null,
    leads_variacao_pct: snap.kpis.leads.delta,
    conversoes_7d: snap.kpis.conversions.value,
    investimento_7d: snap.ads.spend,
    ctr: snap.ads.ctr,
    ctr_variacao_pct: snap.ads.ctrDelta,
    cpa: snap.ads.cpa,
    cpa_variacao_pct: snap.ads.cpaDelta,
    seguidores_instagram: snap.instagram.followers,
    seguidores_variacao: snap.instagram.followersDelta,
    engagement: snap.instagram.engagement,
    website: snap.website,
    reunioes_agendadas: snap.kpis.meetings.value,
    acoes_recentes: snap.timeline.slice(0, 12).map((t: any) => t.title),
    objetivos: snap.memory?.goals ?? null,
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "És o analista da Altus Media. Escreves em português de Portugal, direto e factual. " +
            "Usa APENAS os dados fornecidos. Se um dado for null, não o menciones. Nunca inventes números. " +
            'Responde só com JSON: {"headline": string, "bullets": [{"text": string, "tone": "positivo"|"neutro"|"atencao"}], "risk": string|null}. ' +
            "Máximo 5 bullets, cada um com um número real e uma frase curta.",
        },
        { role: "user", content: JSON.stringify(facts) },
      ],
    }),
  });
  if (!res.ok) {
    console.error("briefing failed", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const body = await res.json();
  const raw = body.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

async function chat(snap: any, messages: any[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { reply: "O assistente está temporariamente indisponível." };

  const context = {
    negocio: snap.client.business_name,
    documentos: (snap.documents ?? []).slice(0, 15).map((d: any) => ({ id: d.id, titulo: d.title, categoria: d.category })),
    relatorios: (snap.reports ?? []).slice(0, 5).map((r: any) => ({ periodo: `${r.period_start} a ${r.period_end}`, resumo: r.summary })),
    recomendacoes: (snap.recommendations ?? []).slice(0, 6),
    alertas: (snap.notifications ?? []).slice(0, 10).map((n: any) => ({ titulo: n.title, detalhe: n.detail, severidade: n.severity })),
    kpis: snap.kpis,
    ads: { ...snap.ads, series: snap.ads.series.slice(-14) },
    instagram: { ...snap.instagram, series: snap.instagram.series.slice(-14), posts: undefined },
    website: snap.website,
    leads_recentes: snap.leads.slice(0, 10),
    inscricoes: snap.signups ? { total: snap.signups.total, ultimos_7_dias: snap.signups.last7 } : null,
    trabalho_recente: snap.timeline.slice(0, 20),
    reunioes: snap.meetings.slice(0, 5),
    memoria: snap.memory,
  };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "És o assistente Altus do cliente " + snap.client.business_name +
            ". Português de Portugal, tom profissional e próximo. Responde apenas com base nos DADOS abaixo. " +
            "Se não tiveres o dado, diz que ainda não está ligado e sugere falar com a equipa. Nunca inventes números.\n\n" +
            "CITAÇÕES: sempre que usares um número ou facto, liga-o à fonte dentro do portal com um link markdown. " +
            "Usa exatamente estes destinos: [Resultados](hub:resultados), [Leads](hub:leads), [Website](hub:website), " +
            "[Documentos](hub:documentos), [Reuniões](hub:reunioes), [Alertas](hub:alertas), [Início](hub:inicio). " +
            "Para um documento específico usa [nome do documento](hub:documentos?doc=ID). " +
            "Termina sempre com uma linha \"**Fontes:** \" seguida dos links usados. Não inventes links nem uses URLs externos.\n\n" +
            "DADOS:\n" +
            JSON.stringify(context),
        },
        ...messages.slice(-10),
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("chat failed", res.status, t.slice(0, 300));
    return { reply: "Não consegui responder agora. Tenta novamente dentro de momentos." };
  }
  const body = await res.json();
  return { reply: body.choices?.[0]?.message?.content ?? "" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { client_id, action = "snapshot", messages = [], document_id, session, notification_id } =
      await req.json();
    if (!client_id || typeof client_id !== "string") return json({ error: "client_id obrigatório" }, 400);

    /* Authorisation: a signed client-portal session for THIS client, or an
       org member / admin using their Supabase session. */
    const sessionClientId = await verifyClientSession(session);
    let allowed = sessionClientId === client_id;
    if (!allowed) {
      const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
      const { data: userData } = jwt ? await admin.auth.getUser(jwt) : { data: null as any };
      const user = userData?.user;
      if (user) {
        const { data: client } = await admin.from("clients").select("organization_id").eq("id", client_id).maybeSingle();
        const [{ data: member }, { data: role }] = await Promise.all([
          admin.from("organization_members").select("id")
            .eq("organization_id", client?.organization_id ?? "").eq("user_id", user.id).maybeSingle(),
          admin.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
        ]);
        allowed = !!(member || role);
      }
    }
    if (!allowed) return json({ error: "Sessão inválida ou expirada." }, 401);

    if (action === "mark_read") {
      await admin.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("client_id", client_id).is("read_at", null)
        .in("id", notification_id ? [notification_id] : []);
      return json({ ok: true });
    }
    if (action === "mark_all_read") {
      await admin.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("client_id", client_id).is("read_at", null);
      return json({ ok: true });
    }

    const snap = await snapshot(client_id);
    if (!snap) return json({ error: "Cliente não encontrado" }, 404);

    if (action === "chat") return json(await chat(snap, messages));
    if (action === "briefing") return json({ briefing: await briefing(snap) });
    if (action === "document_url") {
      const doc = (snap.documents as any[]).find((d) => d.id === document_id);
      if (!doc) return json({ error: "Documento não encontrado" }, 404);
      if (doc.external_url) return json({ url: doc.external_url });
      if (!doc.file_path) return json({ error: "Documento sem ficheiro" }, 400);
      const { data, error } = await admin.storage
        .from("client-documents")
        .createSignedUrl(doc.file_path, 300);
      if (error) return json({ error: error.message }, 500);
      return json({ url: data.signedUrl });
    }

    return json(snap);
  } catch (e) {
    console.error("client-hub error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
