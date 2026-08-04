GRANT SELECT (id, business_name, niche, contact_name, contact_phone, contact_email, login_email, plan, status, logo_url, brand_color, services, start_date, mrr, instagram_baseline, facebook_baseline, leads_baseline, internal_notes, created_at, industry, instagram_handle, meta_ad_account_id) ON public.clients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
REVOKE SELECT (login_password) ON public.clients FROM authenticated, anon;