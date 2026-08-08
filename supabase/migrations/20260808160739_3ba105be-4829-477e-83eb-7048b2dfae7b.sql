-- ============ BUSINESS PROFILES ============
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  legal_name text,
  trade_name text,
  sector text,
  subsector text,
  location text,
  service_area text,
  website_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  google_business_url text,
  phone text,
  email text,
  description text,
  products_services text,
  target_audience text,
  average_ticket numeric,
  business_model text,
  primary_goal text,
  secondary_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  monthly_target numeric,
  tone text,
  competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
  tracking_start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;
GRANT ALL ON public.business_profiles TO service_role;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage business profiles" ON public.business_profiles
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
CREATE TRIGGER business_profiles_updated BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed from existing client_memory + clients
INSERT INTO public.business_profiles (
  organization_id, client_id, legal_name, trade_name, sector, location,
  instagram_url, phone, email, target_audience, products_services,
  primary_goal, tone, competitors, tracking_start_date
)
SELECT
  c.organization_id, c.id, c.business_name, c.business_name, COALESCE(c.industry, c.niche), m.city,
  c.instagram_handle, c.contact_phone, c.contact_email, m.audience, m.offers,
  m.goals, m.tone, COALESCE(m.competitors, '[]'::jsonb), c.start_date
FROM public.clients c
LEFT JOIN public.client_memory m ON m.client_id = c.id
ON CONFLICT (client_id) DO NOTHING;

-- ============ BUSINESS GOALS ============
CREATE TABLE public.business_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  label text NOT NULL,
  metric text NOT NULL,
  unit text,
  target numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  direction text NOT NULL DEFAULT 'up',
  period text NOT NULL DEFAULT 'monthly',
  deadline date,
  status text NOT NULL DEFAULT 'active',
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_goals TO authenticated;
GRANT ALL ON public.business_goals TO service_role;
ALTER TABLE public.business_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage business goals" ON public.business_goals
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
CREATE INDEX business_goals_client_idx ON public.business_goals(client_id, status);
CREATE TRIGGER business_goals_updated BEFORE UPDATE ON public.business_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ GOAL SNAPSHOTS ============
CREATE TABLE public.goal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.business_goals(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, date)
);
GRANT SELECT ON public.goal_snapshots TO authenticated;
GRANT ALL ON public.goal_snapshots TO service_role;
ALTER TABLE public.goal_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read goal snapshots" ON public.goal_snapshots
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_goals g WHERE g.id = goal_id AND public.is_org_member(g.organization_id)));

-- ============ METRIC FACTS (normalized ingestion layer) ============
CREATE TABLE public.metric_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  source text NOT NULL,
  metric text NOT NULL,
  value numeric NOT NULL,
  unit text,
  period text NOT NULL DEFAULT 'day',
  date date NOT NULL,
  campaign_id text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, source, metric, period, date, campaign_id, entity_id)
);
GRANT SELECT ON public.metric_facts TO authenticated;
GRANT ALL ON public.metric_facts TO service_role;
ALTER TABLE public.metric_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read metric facts" ON public.metric_facts
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE INDEX metric_facts_lookup_idx ON public.metric_facts(client_id, metric, date DESC);

-- ============ AI CONVERSATIONS ============
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nova conversa',
  origin text NOT NULL DEFAULT 'client',
  archived_at timestamptz,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read ai conversations" ON public.ai_conversations
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE INDEX ai_conversations_client_idx ON public.ai_conversations(client_id, last_message_at DESC);
CREATE TRIGGER ai_conversations_updated BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read ai messages" ON public.ai_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND public.is_org_member(c.organization_id)));
CREATE INDEX ai_messages_conversation_idx ON public.ai_messages(conversation_id, created_at);

-- ============ AI INSIGHTS ============
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_action text,
  status text NOT NULL DEFAULT 'open',
  confidence text,
  dedupe_key text,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, dedupe_key)
);
GRANT SELECT, UPDATE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage ai insights" ON public.ai_insights
  FOR ALL TO authenticated
  USING (public.is_org_member(organization_id))
  WITH CHECK (public.is_org_member(organization_id));
CREATE INDEX ai_insights_client_idx ON public.ai_insights(client_id, created_at DESC);
CREATE TRIGGER ai_insights_updated BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ACTIVITY EVENTS (shared timeline) ============
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  actor text NOT NULL DEFAULT 'system',
  actor_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  title text NOT NULL,
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  visible_to_client boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read activity events" ON public.activity_events
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE INDEX activity_events_client_idx ON public.activity_events(client_id, created_at DESC);