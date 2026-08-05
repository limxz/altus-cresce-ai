# Ligar as inscrições do site Gracie Barra ao Altus OS

Objetivo: cada inscrição feita no outro projeto Lovable (Gracie Barra Viana do Castelo) chega ao Altus por webhook, fica guardada associada a esse cliente, e aparece no admin e no portal do cliente como contador + gráfico de evolução.

## Como vai funcionar

```text
Site Gracie Barra  --POST /functions/v1/external-signups-->  Altus (valida token)
                                                              |
                                                    grava em external_signups
                                                              |
                                          admin /admin/client/:id  +  portal /clientes
```

O outro site envia um POST sempre que alguém se inscreve. O Altus valida um token secreto por cliente, guarda a inscrição e atualiza os painéis em tempo real.

## O que vai ser construído

1. **Fonte externa por cliente (admin)**
   - Nova secção na ficha do cliente: "Fontes externas".
   - Botão "Criar ligação" gera um endpoint e um token secreto (copiáveis) para colar no outro projeto.
   - Mostra estado: última inscrição recebida, total, e botão para revogar/regenerar token.

2. **Endpoint público de receção**
   - Nova função `external-signups` (pública, sem login) que aceita:
     `{ token, name?, email?, phone?, source?, occurred_at?, metadata? }`.
   - Valida o token, rejeita duplicados (mesmo email/telefone no mesmo dia), regista tudo no log de auditoria e cria notificação "Nova inscrição".

3. **Contador e gráfico**
   - `/admin/client/:id`: KPI "Inscrições" (total + variação 7 dias) e gráfico de barras de inscrições por dia (últimos 30 dias), com recharts, ao lado dos gráficos existentes.
   - Portal do cliente (`/clientes`): mesmo KPI no Início e o gráfico de evolução em Resultados, com atualização em tempo real.

4. **Instruções para o outro projeto**
   - Snippet pronto a colar (fetch para o endpoint com o token) mostrado no admin, para adicionares ao formulário de inscrição do site Gracie Barra. Esse projeto tem de ser editado lá — não consigo escrever nele a partir daqui.

## Detalhes técnicos

- Tabela `external_signups`: `organization_id`, `client_id`, `source`, `name`, `email`, `phone`, `occurred_at`, `metadata jsonb`, `dedupe_key` único.
- Tabela `client_webhook_tokens`: `client_id`, `organization_id`, `token_hash` (hash, nunca texto simples), `label`, `revoked_at`, `last_used_at`. Leitura só por membros da organização; o token completo só é mostrado uma vez, no momento da criação.
- RLS em ambas por `is_org_member(organization_id)`, com GRANTs para `authenticated` e `service_role`.
- `external-signups` corre com service role e `verify_jwt = false`; valida entrada com Zod, devolve 401 se o token for inválido e 200 com `{ ok: true, id }` em caso de sucesso.
- `client-hub` passa a devolver `kpis.signups` e uma série diária `signups.series`; `useClientHub` adiciona `external_signups` às subscrições em tempo real.
- Se preferires, o mesmo endpoint aceita mais tipos de evento no futuro (ex.: pagamentos) através do campo `source`.
