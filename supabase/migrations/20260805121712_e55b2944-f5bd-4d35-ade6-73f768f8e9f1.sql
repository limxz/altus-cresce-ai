
-- 1. scheduling on integrations
ALTER TABLE public.client_integrations
  ADD COLUMN IF NOT EXISTS sync_interval_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS next_sync_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS backoff_until timestamptz;

-- 2. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  detail text,
  href text,
  dedupe_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_dedupe_idx
  ON public.notifications (organization_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notifications_org_created_idx ON public.notifications (organization_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'));

-- 3. automation rules
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage rules" ON public.automation_rules
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER automation_rules_updated BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. automation runs
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read runs" ON public.automation_runs
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'));

-- 5. client memory
CREATE TABLE IF NOT EXISTS public.client_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  goals text,
  niche text,
  city text,
  competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  kpis jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text,
  audience text,
  offers text,
  history text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_memory TO authenticated;
GRANT ALL ON public.client_memory TO service_role;
ALTER TABLE public.client_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage memory" ON public.client_memory
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER client_memory_updated BEFORE UPDATE ON public.client_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. executive reports
CREATE TABLE IF NOT EXISTS public.client_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start date,
  period_end date,
  summary text,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'auto',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_reports_client_idx ON public.client_reports (client_id, created_at DESC);
GRANT SELECT ON public.client_reports TO authenticated;
GRANT ALL ON public.client_reports TO service_role;
ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read reports" ON public.client_reports
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'));

-- 7. realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.automation_runs REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_runs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
