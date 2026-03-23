
-- WhatsApp agents per client
CREATE TABLE public.whatsapp_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  agent_name text NOT NULL DEFAULT 'Assistente',
  business_description text,
  services_info text,
  booking_link text,
  working_hours text DEFAULT 'Seg-Sex 09h-18h',
  phone_number text,
  system_prompt text,
  is_active boolean DEFAULT false,
  twilio_number text,
  total_conversations integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- WhatsApp conversations
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES public.whatsapp_agents(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text,
  first_message text,
  last_message text,
  last_message_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active',
  lead_status text DEFAULT 'novo',
  contact_type text DEFAULT 'desconhecido',
  urgency text DEFAULT 'normal',
  primary_need text,
  sentiment text DEFAULT 'neutro',
  tags text[] DEFAULT '{}',
  classification_summary text,
  is_read boolean DEFAULT false,
  messages_count integer DEFAULT 0
);

-- WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sender text NOT NULL DEFAULT 'bot',
  content text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Conversation state for AI memory
CREATE TABLE public.whatsapp_conversation_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.whatsapp_agents(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  history jsonb DEFAULT '[]',
  last_updated timestamp with time zone DEFAULT now(),
  UNIQUE(agent_id, phone_number)
);

-- RLS
ALTER TABLE public.whatsapp_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_state ENABLE ROW LEVEL SECURITY;

-- Agents: anon can CRUD (admin uses anon role)
CREATE POLICY "Anyone can read whatsapp_agents" ON public.whatsapp_agents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert whatsapp_agents" ON public.whatsapp_agents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update whatsapp_agents" ON public.whatsapp_agents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete whatsapp_agents" ON public.whatsapp_agents FOR DELETE TO anon, authenticated USING (true);

-- Conversations
CREATE POLICY "Anyone can read whatsapp_conversations" ON public.whatsapp_conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert whatsapp_conversations" ON public.whatsapp_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update whatsapp_conversations" ON public.whatsapp_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Messages
CREATE POLICY "Anyone can read whatsapp_messages" ON public.whatsapp_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update whatsapp_messages" ON public.whatsapp_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- State
CREATE POLICY "Anyone can read whatsapp_conversation_state" ON public.whatsapp_conversation_state FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert whatsapp_conversation_state" ON public.whatsapp_conversation_state FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update whatsapp_conversation_state" ON public.whatsapp_conversation_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- service_role bypass for edge functions
CREATE POLICY "Service role full access agents" ON public.whatsapp_agents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access conversations" ON public.whatsapp_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access messages" ON public.whatsapp_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access state" ON public.whatsapp_conversation_state FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
