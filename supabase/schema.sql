export const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  assignee TEXT CHECK (assignee IN ('dj', 'larry')),
  project TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity table
CREATE TABLE IF NOT EXISTS activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('dj', 'larry')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activity FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO tasks (title, description, status, assignee, project, priority) VALUES
  ('Add user authentication to Clayboss', 'Implement OAuth with Google and GitHub', 'backlog', null, 'clayboss', 'high'),
  ('Redesign poker session stats dashboard', 'Create new visualizations for win/loss trends', 'backlog', null, 'poker-sesh', 'medium'),
  ('Fix image upload in sticker generator', 'Resolve 413 error on large image uploads', 'backlog', null, 'sticker-app', 'high'),
  ('Set up CI/CD pipelines for all projects', 'GitHub Actions for testing and deployment', 'backlog', null, 'mission-control', 'low'),
  ('Build Mission Control Dashboard', 'Full-stack dashboard with Supabase backend', 'in_progress', 'larry', 'mission-control', 'high'),
  ('Implement step-by-step guide viewer', 'Interactive pottery recreation guides', 'in_progress', 'dj', 'clayboss', 'medium'),
  ('Add camera capture for pottery items', 'Mobile camera integration with AI analysis', 'review', 'dj', 'clayboss', 'high'),
  ('Set up OpenClaw with Telegram', 'Configure agent and notification channels', 'done', 'larry', 'mission-control', 'high'),
  ('Configure Claude Code OAuth', 'Enable Claude Code for coding tasks', 'done', 'larry', 'mission-control', 'high'),
  ('GitHub authentication setup', 'Connect Larry to GitHub repos', 'done', 'larry', 'mission-control', 'high');

INSERT INTO activity (task_id, action, actor) VALUES
  ((SELECT id FROM tasks WHERE title = 'Build Mission Control Dashboard'), 'created task', 'larry'),
  ((SELECT id FROM tasks WHERE title = 'GitHub authentication setup'), 'completed task', 'larry'),
  ((SELECT id FROM tasks WHERE title = 'Configure Claude Code OAuth'), 'configured OAuth', 'larry');
`;
