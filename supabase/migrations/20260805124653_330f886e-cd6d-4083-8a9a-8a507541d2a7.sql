-- Documents shared with clients
CREATE TABLE public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'relatorio',
  title text NOT NULL,
  description text,
  file_path text,
  external_url text,
  mime_type text,
  size_bytes bigint,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT ALL ON public.client_documents TO service_role;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage client documents" ON public.client_documents
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER client_documents_updated BEFORE UPDATE ON public.client_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_client_documents_client ON public.client_documents(client_id, created_at DESC);

-- Meetings
CREATE TABLE public.client_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'agendada',
  location text,
  notes text,
  ai_summary text,
  recording_url text,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_meetings TO authenticated;
GRANT ALL ON public.client_meetings TO service_role;
ALTER TABLE public.client_meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage client meetings" ON public.client_meetings
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER client_meetings_updated BEFORE UPDATE ON public.client_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_client_meetings_client ON public.client_meetings(client_id, scheduled_at DESC);

-- Scheduled audit-log CSV export settings
CREATE TABLE public.audit_export_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  frequency text NOT NULL DEFAULT 'daily',
  recipients text[] NOT NULL DEFAULT '{}',
  send_hour_utc integer NOT NULL DEFAULT 6,
  last_sent_at timestamptz,
  last_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_export_settings TO authenticated;
GRANT ALL ON public.audit_export_settings TO service_role;
ALTER TABLE public.audit_export_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage audit export settings" ON public.audit_export_settings
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER audit_export_settings_updated BEFORE UPDATE ON public.audit_export_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Client-visible chat (client <-> team/AI) reuses existing conversations tables; add thread type
ALTER TABLE public.client_conversations ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'portal';