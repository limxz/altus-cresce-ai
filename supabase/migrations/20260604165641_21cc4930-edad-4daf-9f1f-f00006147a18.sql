
-- 1. audits: remove public SELECT, admin only
DROP POLICY IF EXISTS "Anyone can read audits" ON public.audits;
CREATE POLICY "Admin can read audits" ON public.audits FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. diagnosticos: remove public SELECT/UPDATE, admin only (keep anon INSERT for forms)
DROP POLICY IF EXISTS "Anyone can read diagnosticos" ON public.diagnosticos;
DROP POLICY IF EXISTS "Anyone can update diagnosticos" ON public.diagnosticos;
CREATE POLICY "Admin can read diagnosticos" ON public.diagnosticos FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update diagnosticos" ON public.diagnosticos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. leads: admin-only SELECT
DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
CREATE POLICY "Admin can read leads" ON public.leads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. plan_requests: admin-only SELECT
DROP POLICY IF EXISTS "Anyone can read plan_requests" ON public.plan_requests;
CREATE POLICY "Admin can read plan_requests" ON public.plan_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. pipeline_leads: admin only
DROP POLICY IF EXISTS "Authenticated can manage pipeline_leads" ON public.pipeline_leads;
CREATE POLICY "Admin can read pipeline_leads" ON public.pipeline_leads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can insert pipeline_leads" ON public.pipeline_leads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update pipeline_leads" ON public.pipeline_leads FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete pipeline_leads" ON public.pipeline_leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. client_conversations: restrict writes to admin (service_role already has full access)
DROP POLICY IF EXISTS "Authenticated can insert client_conversations" ON public.client_conversations;
DROP POLICY IF EXISTS "Authenticated can update client_conversations" ON public.client_conversations;
CREATE POLICY "Admin can insert client_conversations" ON public.client_conversations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update client_conversations" ON public.client_conversations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. whatsapp_agents: restrict writes to admin
DROP POLICY IF EXISTS "Authenticated can insert whatsapp_agents" ON public.whatsapp_agents;
DROP POLICY IF EXISTS "Authenticated can update whatsapp_agents" ON public.whatsapp_agents;
DROP POLICY IF EXISTS "Authenticated can delete whatsapp_agents" ON public.whatsapp_agents;
CREATE POLICY "Admin can insert whatsapp_agents" ON public.whatsapp_agents FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update whatsapp_agents" ON public.whatsapp_agents FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete whatsapp_agents" ON public.whatsapp_agents FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. whatsapp_conversation_state: writes service_role only
DROP POLICY IF EXISTS "Authenticated can insert whatsapp_conversation_state" ON public.whatsapp_conversation_state;
DROP POLICY IF EXISTS "Authenticated can update whatsapp_conversation_state" ON public.whatsapp_conversation_state;

-- 9. whatsapp_conversations: writes admin only
DROP POLICY IF EXISTS "Authenticated can insert whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated can update whatsapp_conversations" ON public.whatsapp_conversations;
CREATE POLICY "Admin can insert whatsapp_conversations" ON public.whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update whatsapp_conversations" ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 10. whatsapp_messages: writes admin only
DROP POLICY IF EXISTS "Authenticated can insert whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Authenticated can update whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Admin can insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update whatsapp_messages" ON public.whatsapp_messages FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
