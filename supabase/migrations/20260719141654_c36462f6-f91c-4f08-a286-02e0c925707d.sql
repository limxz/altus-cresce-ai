
-- Move SECURITY DEFINER logic out of anon/authenticated reach

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Real role check lives in private schema (not exposed via PostgREST)
CREATE OR REPLACE FUNCTION private._has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private._has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private._has_role(uuid, public.app_role) TO authenticated, service_role;

-- public.has_role becomes a thin SECURITY INVOKER wrapper so RLS policies keep working
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private._has_role(_user_id, _role)
$$;

-- verify_client_password only calls crypt(); doesn't need DEFINER
CREATE OR REPLACE FUNCTION public.verify_client_password(_stored_hash text, _plain_password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN _stored_hash = crypt(_plain_password, _stored_hash);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_client_password(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_client_password(text, text) TO service_role;

-- Trigger functions: revoke EXECUTE from anon/authenticated (triggers fire without caller EXECUTE)
REVOKE ALL ON FUNCTION public.hash_client_password() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
