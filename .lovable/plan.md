# Client Portal premium + AltusOS — Fases 1 a 6

Entrega em fases aprovadas. Esta primeira entrega cobre: redesign do Client Portal, arquitetura de dados partilhada, sincronização Admin → Cliente em tempo real, arquitetura de integrações, motor de contexto do AltusOS e chat AltusOS.

Interface em PT-PT, com os nomes de produto em inglês (AltusOS, Growth Score, Daily Brief, Action Center, Business Profile, Goals).
O Admin Dashboard atual não é redesenhado. As alterações no Admin limitam-se a novos separadores de edição (Business Profile e Goals) e a emitir eventos para o portal.

## O que já existe (verificado)

- Base de dados já multi-tenant: `organizations`, `clients`, `client_integrations`, `integration_credentials`, `integration_sync_runs`, `client_memory`, `client_reports`, `client_documents`, `client_meetings`, `notifications`, `automation_rules/runs/approvals`, `audit_log`, `external_signups`, métricas (`instagram_metrics`, `ad_metrics`, `post_metrics`, `metrics`).
- Portal atual (`ClientPortal.tsx` + 8 módulos) já lê tudo por uma única Edge Function `client-hub` com sessão assinada, e já tem realtime por broadcast.
- Existem componentes antigos duplicados e sem uso (`DashboardTab`, `ROITab`, `GrowthTab`, `ContentTab`, `LeadsTab`, `AILabTab`, `WhatsAppLeadsTab`).

Conclusão: a fundação está correta. Isto é uma evolução, não uma reconstrução. Reutilizamos as tabelas existentes e acrescentamos apenas o que falta.

## Fase 2 — Arquitetura de dados (feita primeiro, porque tudo depende dela)

Novas tabelas, todas com `client_id` + `organization_id`, RLS por organização para o Admin e acesso do cliente apenas através da Edge Function autorizada:

- `business_profiles` — perfil completo (setor, subsetor, localização, redes, contactos, descrição, serviços, público-alvo, área geográfica, ticket médio, modelo de negócio, objetivo principal, data de início). Substitui/absorve `client_memory` mantendo os dados atuais migrados.
- `business_goals` — `metric`, `target`, `current_value`, `deadline`, `status`; progresso calculado no backend.
- `goal_snapshots` — histórico diário de cada goal, para progresso e forecast.
- `metric_facts` — camada normalizada de ingestão: `source`, `metric`, `value`, `period`, `date`, `campaign_id`, `client_id`. Todas as integrações escrevem aqui; as tabelas de métricas atuais continuam a funcionar e são também espelhadas para aqui.
- `ai_conversations` + `ai_messages` — histórico do chat AltusOS por cliente.
- `ai_insights` — `type`, `severity`, `title`, `description`, `data`, `sources`, `status`, `recommended_action`.
- `activity_events` — timeline partilhada Admin ↔ Cliente, com `visible_to_client`.

Nada é apagado. Migrations aditivas, com GRANTs e RLS por tabela.

## Fase 3 — Sincronização Admin → Cliente

- Um helper único no backend (`emitEvent`) que, em cada escrita relevante do Admin, grava em `activity_events` + `audit_log`, cria `notifications` quando aplicável e faz broadcast realtime no canal do cliente.
- O portal já ouve esse canal; passa a fazer refetch parcial em vez de recarregar tudo.
- Aplicado a: criação/edição de cliente, profile, goals, documentos, reuniões, relatórios, recomendações, integrações e sincronizações.

## Fase 4 — Integrações

- Página de integrações do cliente (leitura) e do Admin (gestão), cobrindo Meta Ads, Meta Business, Instagram, Facebook, Google Analytics, Search Console, Google Business Profile, Google Ads, Shopify, CRM, WhatsApp, Calendar, Email, Website, TikTok.
- Cada uma mostra estado real: `Connected`, `Syncing`, `Needs attention`, `Disconnected`, `Not configured`, com `last_sync`, erro e retry.
- Quando não há ligação, mostra-se estado vazio com CTA. Nunca métricas inventadas.

## Fase 5 — AltusOS Engine (backend)

Nova Edge Function `altus-os` com um pipeline explícito:

```text
pedido do cliente
  -> validação de sessão e client_id
  -> Business Context Builder (profile, goals, integrações ligadas, métricas atuais e históricas, leads, atividade, insights anteriores)
  -> seleção dos dados relevantes à pergunta
  -> chamada ao modelo (openai/gpt-5.6-sol, Responses API, streaming)
  -> validação da resposta (só métricas existentes)
  -> atribuição de fontes
  -> gravação da conversa / insight
```

Regras aplicadas no servidor:
- Só entra no contexto o que existir de facto para aquele `client_id`.
- Se faltar integração: "Essa informação não está disponível porque a integração X não está ligada."
- Se faltarem dados: "Não tenho dados suficientes para responder com confiança."
- Cada resposta relevante traz ANSWER / WHY / DATA USED / RECOMMENDATION, fontes clicáveis e nível de confiança derivado do volume de dados disponível.

## Fase 6 — Chat AltusOS

- Nova área principal AltusOS no portal, com conversas múltiplas guardadas na base de dados: lista lateral, nova conversa, procurar, renomear, apagar, e URL própria por conversa (`/clientes/altusos/:conversationId`).
- Streaming de resposta, indicador de escrita imediato, markdown, input sempre focado.
- Sugestões iniciais adaptadas ao que o negócio tem ligado.

## Fase 1 — Redesign do Client Portal

Layout novo, estética Linear/Vercel/Stripe: dark, tipografia forte, muito whitespace, bordas subtis, poucos gráficos, microinterações.

Navegação: Início · AltusOS · Resultados · Leads · Website · Documentos · Reuniões · Alertas · Suporte.

Home:
- Saudação com o nome do negócio e "Aqui está o que está a acontecer".
- AI Summary em texto, gerado a partir de dados reais; se não houver, mensagem explícita de dados insuficientes.
- Blocos de Growth Score (placeholder de estrutura nesta fase, cálculo completo na Fase 9), progresso de Goals, KPIs essenciais e "precisa de atenção".
- Botão "Porquê?" nas métricas principais, ligado ao motor de contexto.
- Skeletons premium e estados vazios claros em todo o portal.

Os componentes antigos sem uso são removidos no fim, depois de confirmar que nada os importa.

## Segurança

- RLS em todas as tabelas novas; cliente só acede via Edge Function com sessão assinada e `client_id` derivado do token, nunca do body.
- O contexto de IA é construído exclusivamente com queries filtradas por esse `client_id`.
- Nenhuma chave no frontend.

## Fora desta entrega (fases seguintes)

Insights automáticos, Daily Brief, Growth Score completo, Action Center, aprovações de ações de IA, notificações avançadas e analytics avançada.

## Notas técnicas

- Modelo: `openai/gpt-5.6-sol` via Responses API com streaming.
- Realtime por broadcast já existente, estendido a refetch parcial.
- Carregamento incremental por módulo em vez de um único snapshot gigante, para escalar com o número de clientes.
