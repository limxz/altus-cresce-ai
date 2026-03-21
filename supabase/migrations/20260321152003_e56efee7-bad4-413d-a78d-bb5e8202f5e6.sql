
DROP POLICY "Authenticated users can read diagnosticos" ON public.diagnosticos;
CREATE POLICY "Anyone can read diagnosticos"
ON public.diagnosticos FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY "Authenticated users can update diagnosticos" ON public.diagnosticos;
CREATE POLICY "Anyone can update diagnosticos"
ON public.diagnosticos FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
