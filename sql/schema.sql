-- Costa Sur Proveedores — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Communities reference table
CREATE TABLE communities (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO communities (slug, name) VALUES
  ('villa-valencia', 'Villa Valencia'),
  ('woodlands', 'Woodlands'),
  ('caminos-del-sur', 'Caminos del Sur'),
  ('green-village', 'Green Village'),
  ('panama-pacifico', 'Panama Pacifico'),
  ('brisas-del-golf', 'Brisas del Golf'),
  ('otro', 'Otra comunidad');

-- Providers
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  service TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  community TEXT NOT NULL REFERENCES communities(slug),
  house_number TEXT NOT NULL,
  recommender_name TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendations_provider ON recommendations(provider_id);
CREATE INDEX idx_providers_status ON providers(status);
CREATE INDEX idx_providers_category ON providers(category);

-- Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Public read for approved content
CREATE POLICY "Public read communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Public read approved providers" ON providers FOR SELECT USING (status = 'approved');
CREATE POLICY "Public read approved recommendations" ON recommendations FOR SELECT USING (status = 'approved');

-- Public insert (submissions go to pending)
CREATE POLICY "Public insert providers" ON providers FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Public insert recommendations" ON recommendations FOR INSERT WITH CHECK (status = 'pending');
