-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE period_type AS ENUM ('Q', 'H');
CREATE TYPE project_category AS ENUM ('company', 'personal');

-- Create projects_timeline table
CREATE TABLE IF NOT EXISTS projects_timeline (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  year INTEGER NOT NULL,
  period_type period_type NOT NULL,
  period_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category project_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create projects_detail table
CREATE TABLE IF NOT EXISTS projects_detail (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  period TEXT NOT NULL,
  duration TEXT NOT NULL,
  role TEXT NOT NULL,
  team TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack JSONB NOT NULL,
  achievements JSONB,
  key_features JSONB,
  key_responsibilities JSONB,
  business_goals JSONB,
  architecture_evolution JSONB,
  challenges JSONB,
  learnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  FOREIGN KEY (id) REFERENCES projects_timeline(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  period_type period_type NOT NULL,
  period_number INTEGER NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  events JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_timeline_year ON projects_timeline(year DESC);
CREATE INDEX IF NOT EXISTS idx_projects_timeline_category ON projects_timeline(category);
CREATE INDEX IF NOT EXISTS idx_projects_timeline_is_completed ON projects_timeline(is_completed);
CREATE INDEX IF NOT EXISTS idx_events_year ON events(year DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_timeline_updated_at BEFORE UPDATE ON projects_timeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_detail_updated_at BEFORE UPDATE ON projects_detail
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE projects_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on projects_timeline"
  ON projects_timeline FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on projects_detail"
  ON projects_detail FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on events"
  ON events FOR SELECT
  USING (true);

-- Create policies for authenticated users to insert/update/delete
-- (Optional: uncomment if you want to add authentication later)
-- CREATE POLICY "Allow authenticated users to insert projects_timeline"
--   ON projects_timeline FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users to update projects_timeline"
--   ON projects_timeline FOR UPDATE
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users to delete projects_timeline"
--   ON projects_timeline FOR DELETE
--   TO authenticated
--   USING (true);
