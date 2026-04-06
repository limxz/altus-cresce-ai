
CREATE OR REPLACE FUNCTION public.hash_client_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.login_password IS NOT NULL AND NEW.login_password NOT LIKE '$2a$%' AND NEW.login_password NOT LIKE '$2b$%' THEN
    NEW.login_password := crypt(NEW.login_password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;
