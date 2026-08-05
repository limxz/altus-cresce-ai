CREATE POLICY "team manages client documents storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'client-documents')
  WITH CHECK (bucket_id = 'client-documents');