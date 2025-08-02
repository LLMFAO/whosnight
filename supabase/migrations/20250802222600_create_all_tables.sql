-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name TEXT,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Supabase Auth UUID
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- "mom", "dad", "teen", or "caretaker"
  family_id INTEGER REFERENCES families(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create calendar_assignments table
CREATE TABLE IF NOT EXISTS calendar_assignments (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  assigned_to TEXT, -- "mom", "dad", or null
  created_by TEXT NOT NULL, -- UUID
  status TEXT NOT NULL DEFAULT 'pending', -- "pending", "confirmed"
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  name TEXT NOT NULL,
  time TEXT, -- Optional time string
  location TEXT,
  description TEXT,
  children TEXT[] DEFAULT '{}',
  created_by TEXT NOT NULL, -- UUID
  status TEXT NOT NULL DEFAULT 'pending', -- "pending", "confirmed", "cancelled"
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  due_date TEXT, -- YYYY-MM-DD format
  assigned_to TEXT NOT NULL, -- "mom" or "dad"
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_by TEXT NOT NULL, -- UUID
  status TEXT NOT NULL DEFAULT 'pending', -- "pending", "confirmed"
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  paid_by TEXT NOT NULL, -- "mom" or "dad"
  description TEXT,
  has_receipt BOOLEAN DEFAULT FALSE NOT NULL,
  created_by TEXT NOT NULL, -- UUID
  status TEXT NOT NULL DEFAULT 'pending', -- "pending", "confirmed"
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create action_logs table
CREATE TABLE IF NOT EXISTS action_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- UUID
  action TEXT NOT NULL, -- "created", "updated", "deleted", "approved", "rejected", "undone"
  entity_type TEXT, -- "assignment", "event", "task", "expense"
  entity_id INTEGER,
  details TEXT NOT NULL, -- JSON string with change details
  previous_state TEXT, -- JSON string with previous state for undo
  requested_by TEXT, -- UUID - Who originally requested this change
  approved_by TEXT, -- UUID - Who approved this change
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create share_links table
CREATE TABLE IF NOT EXISTS share_links (
  id SERIAL PRIMARY KEY,
  link_id TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL, -- UUID
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Create teen_permissions table
CREATE TABLE IF NOT EXISTS teen_permissions (
  id SERIAL PRIMARY KEY,
  teen_user_id TEXT NOT NULL, -- UUID
  can_modify_assignments BOOLEAN DEFAULT FALSE,
  can_add_events BOOLEAN DEFAULT FALSE,
  can_add_tasks BOOLEAN DEFAULT FALSE,
  can_add_expenses BOOLEAN DEFAULT FALSE,
  is_read_only BOOLEAN DEFAULT TRUE,
  modified_by TEXT NOT NULL, -- UUID - parent who set permissions
  modified_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_calendar_assignments_date ON calendar_assignments(date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_entity ON action_logs(entity_type, entity_id);

-- Enable Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE teen_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Create RLS policies for families table
CREATE POLICY "Users can view their family" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM users WHERE id = auth.uid()::text)
  );

-- Create RLS policies for calendar_assignments table
CREATE POLICY "Family members can view calendar assignments" ON calendar_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can create calendar assignments" ON calendar_assignments
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can update calendar assignments" ON calendar_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can delete calendar assignments" ON calendar_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

-- Create RLS policies for events table
CREATE POLICY "Family members can view events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can update events" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can delete events" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

-- Create RLS policies for tasks table
CREATE POLICY "Family members can view tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

-- Create RLS policies for expenses table
CREATE POLICY "Family members can view expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can create expenses" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can update expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

-- Create RLS policies for action_logs table
CREATE POLICY "Family members can view action logs" ON action_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Family members can create action logs" ON action_logs
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id IS NOT NULL
    )
  );

-- Create RLS policies for teen_permissions table
CREATE POLICY "Parents can manage teen permissions" ON teen_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role IN ('mom', 'dad')
      AND family_id IS NOT NULL
    )
  );

CREATE POLICY "Teens can view their own permissions" ON teen_permissions
  FOR SELECT USING (
    auth.uid()::text = teen_user_id
  );