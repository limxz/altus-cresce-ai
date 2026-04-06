
-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create admin role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage roles
CREATE POLICY "Service role manages roles"
ON public.user_roles FOR ALL
TO service_role
USING (true) WITH CHECK (true);

-- Authenticated users can read their own roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Create has_role function (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Insert admin role for admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('312caf05-3519-4530-b63f-a0d873d064c5', 'admin');

-- 5. Hash existing plaintext passwords
UPDATE public.clients
SET login_password = crypt(login_password, gen_salt('bf'));

-- 6. Create trigger to auto-hash passwords on insert/update
CREATE OR REPLACE FUNCTION public.hash_client_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only hash if password changed and isn't already a bcrypt hash
  IF NEW.login_password IS NOT NULL AND NEW.login_password NOT LIKE '$2a$%' AND NEW.login_password NOT LIKE '$2b$%' THEN
    NEW.login_password := crypt(NEW.login_password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER hash_password_before_save
BEFORE INSERT OR UPDATE OF login_password ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.hash_client_password();

-- 7. Restrict clients table RLS to admin only
DROP POLICY IF EXISTS "Authenticated can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can delete clients" ON public.clients;

CREATE POLICY "Admin can read clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Also restrict other admin-only tables to admin role
-- metrics
DROP POLICY IF EXISTS "Anyone can read metrics" ON public.metrics;
DROP POLICY IF EXISTS "Authenticated can insert metrics" ON public.metrics;
DROP POLICY IF EXISTS "Authenticated can update metrics" ON public.metrics;

CREATE POLICY "Admin can read metrics"
ON public.metrics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert metrics"
ON public.metrics FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update metrics"
ON public.metrics FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- content_posts
DROP POLICY IF EXISTS "Anyone can read content_posts" ON public.content_posts;
DROP POLICY IF EXISTS "Authenticated can insert content_posts" ON public.content_posts;
DROP POLICY IF EXISTS "Authenticated can update content_posts" ON public.content_posts;

CREATE POLICY "Admin can read content_posts"
ON public.content_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert content_posts"
ON public.content_posts FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update content_posts"
ON public.content_posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- whatsapp tables
DROP POLICY IF EXISTS "Anyone can read whatsapp_agents" ON public.whatsapp_agents;
CREATE POLICY "Admin can read whatsapp_agents"
ON public.whatsapp_agents FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read whatsapp_conversations" ON public.whatsapp_conversations;
CREATE POLICY "Admin can read whatsapp_conversations"
ON public.whatsapp_conversations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Admin can read whatsapp_messages"
ON public.whatsapp_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read whatsapp_conversation_state" ON public.whatsapp_conversation_state;
CREATE POLICY "Admin can read whatsapp_conversation_state"
ON public.whatsapp_conversation_state FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read client_conversations" ON public.client_conversations;
CREATE POLICY "Admin can read client_conversations"
ON public.client_conversations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can read client_messages" ON public.client_messages;
CREATE POLICY "Admin can read client_messages"
ON public.client_messages FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
