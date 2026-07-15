
CREATE TABLE public.proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('screenshot','video','testemunho','dashboard','conversa','outro')),
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  client_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.proofs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proofs TO authenticated;
GRANT ALL ON public.proofs TO service_role;

ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active proofs"
  ON public.proofs FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert proofs"
  ON public.proofs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update proofs"
  ON public.proofs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete proofs"
  ON public.proofs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_proofs_updated_at
  BEFORE UPDATE ON public.proofs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
