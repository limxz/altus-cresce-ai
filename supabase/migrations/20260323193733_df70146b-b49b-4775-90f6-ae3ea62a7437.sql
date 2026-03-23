CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text,
  telefone text,
  monthly_loss numeric,
  source text DEFAULT 'calculadora',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read leads" ON leads FOR SELECT TO anon, authenticated USING (true);