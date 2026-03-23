
-- Clients table
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  niche text NOT NULL DEFAULT 'outros',
  contact_name text NOT NULL,
  contact_phone text,
  contact_email text,
  login_email text UNIQUE NOT NULL,
  login_password text NOT NULL,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  logo_url text,
  brand_color text DEFAULT '#7C3AED',
  services jsonb DEFAULT '[]'::jsonb,
  start_date date DEFAULT CURRENT_DATE,
  mrr numeric DEFAULT 0,
  instagram_baseline integer DEFAULT 0,
  facebook_baseline integer DEFAULT 0,
  leads_baseline integer DEFAULT 0,
  internal_notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read clients" ON public.clients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert clients" ON public.clients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update clients" ON public.clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete clients" ON public.clients FOR DELETE TO anon, authenticated USING (true);

-- Metrics table
CREATE TABLE public.metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  instagram_followers integer DEFAULT 0,
  facebook_followers integer DEFAULT 0,
  leads_count integer DEFAULT 0,
  bot_conversations integer DEFAULT 0,
  posts_published integer DEFAULT 0,
  health_score integer DEFAULT 50,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read metrics" ON public.metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert metrics" ON public.metrics FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update metrics" ON public.metrics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Client conversations table
CREATE TABLE public.client_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  bot_type text NOT NULL DEFAULT 'whatsapp',
  contact_name text,
  contact_phone text,
  status text NOT NULL DEFAULT 'warm',
  started_at timestamp with time zone DEFAULT now(),
  last_message_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read client_conversations" ON public.client_conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert client_conversations" ON public.client_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update client_conversations" ON public.client_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Messages table
CREATE TABLE public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.client_conversations(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL DEFAULT 'bot',
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read client_messages" ON public.client_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert client_messages" ON public.client_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Content posts table
CREATE TABLE public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  image_url text,
  caption text,
  hashtags text,
  scheduled_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  client_feedback text,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content_posts" ON public.content_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert content_posts" ON public.content_posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update content_posts" ON public.content_posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
