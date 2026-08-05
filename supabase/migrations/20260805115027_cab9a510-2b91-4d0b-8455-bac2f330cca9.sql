-- 1. Organizations (multi-tenant base)
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.is_org_member(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m WHERE m.organization_id = _org AND m.user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT private.is_org_member(_org, auth.uid())
$$;
REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;

CREATE POLICY "members read own orgs" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "members read own membership" ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- 2. Default org + backfill existing clients
INSERT INTO public.organizations (name, slug) VALUES ('Altus Media', 'altus-media');

ALTER TABLE public.clients ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.clients SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'altus-media');
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX idx_clients_org ON public.clients(organization_id);

-- 3. Per-client integrations (non-secret state, readable by the app)
CREATE TABLE public.client_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  external_account_id text,
  display_name text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  auto_sync boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_integrations TO authenticated;
GRANT ALL ON public.client_integrations TO service_role;
ALTER TABLE public.client_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage integrations" ON public.client_integrations
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_org_member(organization_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_client_integrations_updated BEFORE UPDATE ON public.client_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Credentials: service_role only, never reachable from the browser
CREATE TABLE private.integration_credentials (
  integration_id uuid PRIMARY KEY REFERENCES public.client_integrations(id) ON DELETE CASCADE,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.integration_credentials ENABLE ROW LEVEL SECURITY;
GRANT ALL ON private.integration_credentials TO service_role;

-- 5. Sync run history
CREATE TABLE public.integration_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.client_integrations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL,
  records_written integer NOT NULL DEFAULT 0,
  message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.integration_sync_runs TO authenticated;
GRANT ALL ON public.integration_sync_runs TO service_role;
ALTER TABLE public.integration_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read sync runs" ON public.integration_sync_runs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id
            AND (public.is_org_member(c.organization_id) OR public.has_role(auth.uid(),'admin')))
  );
CREATE INDEX idx_sync_runs_client ON public.integration_sync_runs(client_id, created_at DESC);