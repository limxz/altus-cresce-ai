
-- ============================================
-- CLIENTS TABLE: Restrict to service_role only
-- ============================================
DROP POLICY IF EXISTS "Anyone can read clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON public.clients;

CREATE POLICY "Service role full access clients"
  ON public.clients FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read non-sensitive client data (needed for admin panel)
CREATE POLICY "Authenticated can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- CONTENT_POSTS TABLE: Restrict writes to authenticated
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert content_posts" ON public.content_posts;
DROP POLICY IF EXISTS "Anyone can update content_posts" ON public.content_posts;

CREATE POLICY "Authenticated can insert content_posts"
  ON public.content_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update content_posts"
  ON public.content_posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- METRICS TABLE: Restrict writes to authenticated
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert metrics" ON public.metrics;
DROP POLICY IF EXISTS "Anyone can update metrics" ON public.metrics;

CREATE POLICY "Authenticated can insert metrics"
  ON public.metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update metrics"
  ON public.metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CLIENT_CONVERSATIONS: Restrict writes to authenticated/service_role
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert client_conversations" ON public.client_conversations;
DROP POLICY IF EXISTS "Anyone can update client_conversations" ON public.client_conversations;

CREATE POLICY "Authenticated can insert client_conversations"
  ON public.client_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update client_conversations"
  ON public.client_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access client_conversations"
  ON public.client_conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CLIENT_MESSAGES: Restrict writes to authenticated/service_role
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert client_messages" ON public.client_messages;

CREATE POLICY "Authenticated can insert client_messages"
  ON public.client_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role full access client_messages"
  ON public.client_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PIPELINE_LEADS: Restrict to authenticated only
-- ============================================
DROP POLICY IF EXISTS "Anyone can manage pipeline_leads" ON public.pipeline_leads;

CREATE POLICY "Authenticated can manage pipeline_leads"
  ON public.pipeline_leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- WHATSAPP tables: keep service_role, restrict anon writes
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Anyone can update whatsapp_conversations" ON public.whatsapp_conversations;

CREATE POLICY "Authenticated can insert whatsapp_conversations"
  ON public.whatsapp_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update whatsapp_conversations"
  ON public.whatsapp_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Anyone can update whatsapp_messages" ON public.whatsapp_messages;

CREATE POLICY "Authenticated can insert whatsapp_messages"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update whatsapp_messages"
  ON public.whatsapp_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert whatsapp_agents" ON public.whatsapp_agents;
DROP POLICY IF EXISTS "Anyone can update whatsapp_agents" ON public.whatsapp_agents;
DROP POLICY IF EXISTS "Anyone can delete whatsapp_agents" ON public.whatsapp_agents;

CREATE POLICY "Authenticated can insert whatsapp_agents"
  ON public.whatsapp_agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update whatsapp_agents"
  ON public.whatsapp_agents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete whatsapp_agents"
  ON public.whatsapp_agents FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert whatsapp_conversation_state" ON public.whatsapp_conversation_state;
DROP POLICY IF EXISTS "Anyone can update whatsapp_conversation_state" ON public.whatsapp_conversation_state;

CREATE POLICY "Authenticated can insert whatsapp_conversation_state"
  ON public.whatsapp_conversation_state FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update whatsapp_conversation_state"
  ON public.whatsapp_conversation_state FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
