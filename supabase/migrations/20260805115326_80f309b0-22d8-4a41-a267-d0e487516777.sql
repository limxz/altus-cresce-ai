ALTER TABLE public.client_integrations REPLICA IDENTITY FULL;
ALTER TABLE public.integration_sync_runs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_integrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_sync_runs;