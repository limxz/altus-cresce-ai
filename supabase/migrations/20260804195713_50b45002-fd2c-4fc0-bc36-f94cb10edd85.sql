-- Extend existing clients table with the requested fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS meta_ad_account_id text;

-- Instagram daily metrics
CREATE TABLE public.instagram_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  followers_count int,
  followers_gained int,
  reach int,
  engagement_rate numeric,
  profile_visits int,
  website_clicks int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instagram_metrics TO authenticated;
GRANT ALL ON public.instagram_metrics TO service_role;
ALTER TABLE public.instagram_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage instagram_metrics" ON public.instagram_metrics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Post metrics
CREATE TABLE public.post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  post_type text,
  posted_at timestamptz,
  reach int,
  likes int,
  comments int,
  saves int,
  shares int,
  script_structure text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_metrics TO authenticated;
GRANT ALL ON public.post_metrics TO service_role;
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage post_metrics" ON public.post_metrics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Meta Ads metrics
CREATE TABLE public.ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  spend numeric,
  impressions int,
  clicks int,
  messages_started int,
  cost_per_message numeric,
  conversions int,
  cost_per_conversion numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_metrics TO authenticated;
GRANT ALL ON public.ad_metrics TO service_role;
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ad_metrics" ON public.ad_metrics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- AI recommendations history
CREATE TABLE public.ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  period_start date,
  period_end date,
  summary text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_recommendations TO authenticated;
GRANT ALL ON public.ai_recommendations TO service_role;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai_recommendations" ON public.ai_recommendations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER update_instagram_metrics_updated_at BEFORE UPDATE ON public.instagram_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_post_metrics_updated_at BEFORE UPDATE ON public.post_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ad_metrics_updated_at BEFORE UPDATE ON public.ad_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_instagram_metrics_client_date ON public.instagram_metrics (client_id, date DESC);
CREATE INDEX idx_ad_metrics_client_date ON public.ad_metrics (client_id, date DESC);
CREATE INDEX idx_post_metrics_client_posted ON public.post_metrics (client_id, posted_at DESC);
CREATE INDEX idx_ai_recommendations_client ON public.ai_recommendations (client_id, generated_at DESC);