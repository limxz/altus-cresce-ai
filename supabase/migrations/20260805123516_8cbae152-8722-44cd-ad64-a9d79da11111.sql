CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  integration_id uuid REFERENCES public.client_integrations(id) ON DELETE SET NULL,
  actor text NOT NULL DEFAULT 'system',
  actor_id uuid,
  action_type text NOT NULL,
  provider text,
  status text NOT NULL DEFAULT 'success',
  title text NOT NULL,
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read audit log" ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

CREATE INDEX idx_audit_log_org_created ON public.audit_log (organization_id, created_at DESC);
CREATE INDEX idx_audit_log_client ON public.audit_log (client_id);
CREATE INDEX idx_audit_log_integration ON public.audit_log (integration_id);

CREATE TABLE public.automation_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  trigger_type text NOT NULL,
  action_type text NOT NULL,
  title text NOT NULL,
  detail text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.automation_approvals TO authenticated;
GRANT ALL ON public.automation_approvals TO service_role;
ALTER TABLE public.automation_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read approvals" ON public.automation_approvals
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "Org members decide approvals" ON public.automation_approvals
  FOR UPDATE TO authenticated USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));

CREATE UNIQUE INDEX idx_approvals_dedupe ON public.automation_approvals (organization_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_approvals_status ON public.automation_approvals (organization_id, status, created_at DESC);

CREATE TRIGGER automation_approvals_updated BEFORE UPDATE ON public.automation_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT true;

ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_approvals;