CREATE TABLE public.external_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'external',
  name text,
  email text,
  phone text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX external_signups_dedupe_idx ON public.external_signups (client_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX external_signups_client_time_idx ON public.external_signups (client_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_signups TO authenticated;
GRANT ALL ON public.external_signups TO service_role;

ALTER TABLE public.external_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage external signups"
ON public.external_signups FOR ALL TO authenticated
USING (public.is_org_member(organization_id))
WITH CHECK (public.is_org_member(organization_id));

CREATE TABLE public.client_webhook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Site externo',
  token_prefix text NOT NULL,
  token_hash text NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX client_webhook_tokens_hash_idx ON public.client_webhook_tokens (token_hash);
CREATE INDEX client_webhook_tokens_client_idx ON public.client_webhook_tokens (client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_webhook_tokens TO authenticated;
GRANT ALL ON public.client_webhook_tokens TO service_role;

ALTER TABLE public.client_webhook_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members manage webhook tokens"
ON public.client_webhook_tokens FOR ALL TO authenticated
USING (public.is_org_member(organization_id))
WITH CHECK (public.is_org_member(organization_id));

CREATE TRIGGER client_webhook_tokens_updated
BEFORE UPDATE ON public.client_webhook_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.external_signups;