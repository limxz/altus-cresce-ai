# Plano — Homepage de conversão + CMS no /admin

Trabalho grande. Vou dividir em **3 fases** para poderes validar entre cada uma. A identidade visual (dark, gradientes roxo/azul/cyan, tipografia, animações) mantém-se. O que muda é hierarquia, copy, credibilidade e a possibilidade de editar tudo pelo admin.

---

## Fase 1 — Homepage nova (frontend, sem CMS ainda)

Refaço a homepage já com o copy final e dados hardcoded temporariamente (Gracie Barra, métricas, etc.). Isto permite ver o resultado visual rapidamente. Na Fase 3 tudo passa a vir da base de dados.

Ordem das secções da nova `/`:

1. **Hero** — nova headline "Geramos clientes para negócios locais através de Meta Ads, Google Ads e Inteligência Artificial." + subheadline pedida. CTAs: "Pedir Auditoria Gratuita" (abre booking) e "Experimentar o Agente IA" (scroll para agente). Três provas rápidas por baixo (+24 negócios, +142k€, +2400 mensagens).
2. **Resultados Reais** — 3 métricas grandes + faixa de logos de clientes (Gracie Barra + placeholders sóbrios).
3. **Sistema Altus** — substitui "O que fazemos". Fluxo visual horizontal: Anúncios → Landing Page → IA → WhatsApp → Follow-up → Novo Cliente. Cada nó com micro-descrição.
4. **Case Study Gracie Barra** — card premium com problema/solução/serviços/métricas + screenshots (uso placeholders até termos imagens reais).
5. **Agente IA** — mantém o `WhatsAppDemo` atual. Adiciono acima 4 bullets ("responde automaticamente", "marca reuniões", "24h", "qualifica leads") e headline "Experimenta exatamente aquilo que os teus clientes vão utilizar".
6. **Como Funciona** — 4 passos (Analisamos → Criamos → Lançamos → Otimizamos) com linha de progresso.
7. **Porquê Altus** — 6 cards (sem contratos, IA integrada, relatórios, suporte, especialistas locais, foco ROI).
8. **Ferramentas** — faixa minimalista com logos Meta, Google Ads, GA, OpenAI, WhatsApp, n8n, Cloudflare, Stripe, GTM.
9. **Testemunhos** — cards (por agora 1–2, prontos para receber mais do CMS).
10. **Provas Reais** — mosaico tipo bento-grid com screenshots/conversas (a tua ideia extra — concordo, fica na Fase 1 já).
11. **FAQ** — mantém `AltusFAQ` + adiciono as perguntas novas (contrato, tempo, custo, negócios aceites, Portugal, pagamento).
12. **CTA Final** — mantém `FinalCTA` com copy pedido.
13. **Footer** — mantém.

Componentes removidos/movidos: `ROICalculator` e `AIDiagnostic` deixam de estar na home (continuam a existir, mas a home fica mais focada). Se preferires manter, diz.

---

## Fase 2 — Backend do CMS (migração + edge functions)

Novas tabelas no Lovable Cloud (todas com RLS admin-only para escrita, leitura pública apenas onde faz sentido para a homepage):

- `site_settings` (key/value JSON) — hero, badge, métricas globais, textos do agente IA, textos da calculadora.
- `client_logos` — nome, imagem, website, ordem, ativo.
- `testimonials` — foto, nome, empresa, cargo, texto, rating, video_url, ordem, ativo.
- `case_studies` — todos os campos que pediste (slug, cliente, problema, solução, resultados, serviços, screenshots[], galeria[], vídeo, testemunho_id, seo_title, seo_description, og_image, publicado, ordem).
- `case_metrics` — case_study_id, label, value, ordem (métricas dinâmicas por case).
- `proofs` — tipo (screenshot/video/testimonial/dashboard/conversation/other), título, descrição, media_url, cliente_id, ordem, destaque, ativo.
- `services_cms` — título, descrição, ícone, imagem, ordem, ativo.
- `faqs` — pergunta, resposta, categoria, ordem, ativo.
- `page_seo` — path, title, description, keywords, og_image, canonical, schema_json.

Storage bucket público `cms-media` para uploads (imagens de logos, testemunhos, cases, provas).

Políticas: leitura pública nas tabelas de conteúdo da homepage; escrita apenas `has_role(admin)`.

---

## Fase 3 — Admin CMS + ligar homepage à BD

Novo menu lateral no `/admin` com as secções pedidas. Cada uma é um CRUD com formulário + tabela + upload drag-and-drop (logos, testemunhos, cases, provas, serviços, FAQ). Editores para: Hero, Estatísticas, Calculadora, Agente IA, SEO por página.

Depois, os componentes da homepage passam a ler destas tabelas com React Query (fallback para os valores da Fase 1 se a tabela estiver vazia). Cache curto para o site continuar rápido.

---

## Notas técnicas

- Mantém stack: React + Vite + Tailwind + shadcn + framer-motion + react-helmet-async + Supabase.
- Todos os componentes novos usam os tokens semânticos existentes (`--primary`, `--secondary`, `--accent`, `text-gradient`, `mesh-gradient-bg`, `section-glow-*`). Zero cores hardcoded.
- Uploads via `storage_upload` no bucket `cms-media`.
- SEO por rota já está com `react-helmet-async`; o CMS de SEO escreve para `page_seo` e cada página lê o registo do seu path.
- Performance: lazy-load das secções abaixo da fold (`React.lazy` + `Suspense`), `loading="lazy"` em imagens, `vite-imagetools` para converter screenshots grandes.
- "Lighthouse 100/100" em todas as métricas é objetivo — não uma garantia contratual, porque depende também da rede e do dispositivo do avaliador. Vou aproximar o máximo possível.

---

## O que preciso de ti antes de começar

1. **Aprovas as 3 fases nesta ordem?** Ou queres que eu faça tudo de uma vez (fica muito grande num só turno e mais difícil de rever).
2. **Confirmas remover `ROICalculator` e `AIDiagnostic` da home?** (continuam a existir no código, só saem da homepage).
3. **Logos de clientes** — para além da Gracie Barra, tens ficheiros de outros logos para eu subir já, ou fica só Gracie Barra + placeholders discretos até adicionares pelo admin?
4. **Screenshots do case Gracie Barra** (landing, Meta Ads, dashboard, automações) — tens ou uso mockups temporários?

Assim que responderes, arranco pela Fase 1.
