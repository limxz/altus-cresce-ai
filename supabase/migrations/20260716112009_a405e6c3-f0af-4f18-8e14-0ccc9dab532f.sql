
-- 1) client_messages INSERT: restrict to admins
DROP POLICY IF EXISTS "Authenticated can insert client_messages" ON public.client_messages;
CREATE POLICY "Admins can insert client_messages"
ON public.client_messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) storage: proofs bucket - restrict reads to admins
DROP POLICY IF EXISTS "Public can read proofs files" ON storage.objects;
CREATE POLICY "Admins can read proofs files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Revoke execute on SECURITY DEFINER functions not intended for client calls
REVOKE ALL ON FUNCTION public.verify_client_password(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_client_password(text, text) TO service_role;

REVOKE ALL ON FUNCTION public.hash_client_password() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hash_client_password() TO service_role;
