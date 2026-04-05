-- Migration: Criação da tabela de relatórios mensais por cliente
-- Data: 2025-04-05

create table if not exists public.client_reports (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  month integer not null check (month between 1 and 12),
  year integer not null,
  leads_generated integer default 0,
  conversations_handled integer default 0,
  posts_published integer default 0,
  followers_gained integer default 0,
  estimated_revenue numeric(10,2) default 0,
  roi_ratio numeric(5,2) default 0,
  pdf_url text,
  sent_at timestamptz,
  created_at timestamptz default now(),
  unique(client_id, month, year)
);

alter table public.client_reports enable row level security;

create policy "Clients can view own reports"
  on public.client_reports for select
  using (
    client_id in (
      select id from public.clients where login_email = current_user
    )
  );

create policy "Service role full access"
  on public.client_reports
  using (auth.role() = 'service_role');
