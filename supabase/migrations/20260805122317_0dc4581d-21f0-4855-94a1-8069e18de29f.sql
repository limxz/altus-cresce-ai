DROP INDEX IF EXISTS public.notifications_dedupe_idx;
CREATE UNIQUE INDEX notifications_dedupe_idx ON public.notifications (organization_id, dedupe_key);