-- Add email column to users table for Supabase Auth compatibility
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;

-- Add created_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the users table to change id from serial to text (UUID) for Supabase Auth
-- Note: This is a breaking change that requires data migration if you have existing data

-- First, create a new table with the correct structure
CREATE TABLE users_new (
    id TEXT PRIMARY KEY, -- Supabase Auth UUID
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- "mom", "dad", "teen", or "caretaker"
    family_id INTEGER REFERENCES families(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If you have existing data, you would need to migrate it here
-- For now, we'll assume this is a fresh start or you'll handle data migration separately

-- Drop the old table and rename the new one
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE users_new RENAME TO users;

-- Update all foreign key references to use TEXT instead of INTEGER
-- Update calendar_assignments
ALTER TABLE calendar_assignments ALTER COLUMN created_by TYPE TEXT;

-- Update events
ALTER TABLE events ALTER COLUMN created_by TYPE TEXT;

-- Update tasks
ALTER TABLE tasks ALTER COLUMN created_by TYPE TEXT;

-- Update expenses
ALTER TABLE expenses ALTER COLUMN created_by TYPE TEXT;

-- Update action_logs
ALTER TABLE action_logs ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE action_logs ALTER COLUMN requested_by TYPE TEXT;
ALTER TABLE action_logs ALTER COLUMN approved_by TYPE TEXT;

-- Update share_links
ALTER TABLE share_links ALTER COLUMN created_by TYPE TEXT;

-- Update teen_permissions
ALTER TABLE teen_permissions ALTER COLUMN teen_user_id TYPE TEXT;
ALTER TABLE teen_permissions ALTER COLUMN modified_by TYPE TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);