
CREATE TABLE public.diagnosticos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  nome text NOT NULL,
  email text NOT NULL,
  instagram_url text NOT NULL,
  site_url text,
  setor text,
  score integer,
  diagnostico_json jsonb,
  contactado boolean DEFAULT false
);

ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can submit a diagnostic)
CREATE POLICY "Anyone can insert diagnosticos"
ON public.diagnosticos FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can read (admin)
CREATE POLICY "Authenticated users can read diagnosticos"
ON public.diagnosticos FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update (admin toggle contactado)
CREATE POLICY "Authenticated users can update diagnosticos"
ON public.diagnosticos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
