
CREATE TABLE IF NOT EXISTS audits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name text,
  business_type text,
  city text,
  url text,
  email text,
  score integer,
  audit_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert audits" ON audits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read audits" ON audits FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS pipeline_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  plan_value numeric DEFAULT 297,
  stage text DEFAULT 'novo',
  score integer DEFAULT 50,
  notes text,
  next_action text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage pipeline_leads" ON pipeline_leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS plan_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text,
  email text,
  telefone text,
  business_name text,
  business_type text,
  problems text[],
  revenue_range text,
  plan_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert plan_requests" ON plan_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read plan_requests" ON plan_requests FOR SELECT TO anon, authenticated USING (true);
