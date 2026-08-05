DROP TABLE IF EXISTS private.integration_credentials;

CREATE TABLE public.integration_credentials (
  integration_id uuid PRIMARY KEY REFERENCES public.client_integrations(id) ON DELETE CASCADE,
  secrets jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.integration_credentials FROM anon, authenticated;
GRANT ALL ON public.integration_credentials TO service_role;
ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.integration_credentials
  FOR ALL TO service_role USING (true) WITH CHECK (true);