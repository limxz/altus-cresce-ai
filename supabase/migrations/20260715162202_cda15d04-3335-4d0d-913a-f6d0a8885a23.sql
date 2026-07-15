
CREATE POLICY "Public can read proofs files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');

CREATE POLICY "Admins can upload proofs files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update proofs files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete proofs files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proofs' AND public.has_role(auth.uid(), 'admin'));
