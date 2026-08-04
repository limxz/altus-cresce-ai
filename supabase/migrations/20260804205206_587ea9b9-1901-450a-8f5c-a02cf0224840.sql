-- Ensure passwords are always hashed (defense in depth for the existing trigger)
CREATE OR REPLACE FUNCTION public.hash_client_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.login_password IS NOT NULL
     AND NEW.login_password !~ '^\$2[aby]\$'
  THEN
    NEW.login_password := crypt(NEW.login_password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$function$;

-- Column-level protection: password hashes are never selectable by app roles
REVOKE SELECT ON public.clients FROM authenticated;
REVOKE SELECT ON public.clients FROM anon;

GRANT SELECT (
  id, business_name, niche, contact_name, contact_phone, contact_email,
  login_email, plan, status, logo_url, brand_color, services, start_date,
  mrr, instagram_baseline, facebook_baseline, leads_baseline, internal_notes,
  created_at, industry, instagram_handle, meta_ad_account_id
) ON public.clients TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;