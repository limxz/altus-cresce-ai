
CREATE OR REPLACE FUNCTION public.verify_client_password(_stored_hash text, _plain_password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN _stored_hash = crypt(_plain_password, _stored_hash);
END;
$$;
