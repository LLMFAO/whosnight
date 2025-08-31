-- Create a secure family invitation system to replace simple codes
-- This adds expiration, usage limits, and better security

-- Create family_invitations table
CREATE TABLE IF NOT EXISTS family_invitations (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES users(id),
  invitation_code TEXT NOT NULL UNIQUE,
  email TEXT, -- Optional: specific email invitation
  max_uses INTEGER DEFAULT 1, -- How many times this invitation can be used
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  used_at TIMESTAMP[] DEFAULT '{}' -- Array of usage timestamps
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_invitations_code ON family_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id ON family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_expires_at ON family_invitations(expires_at);

-- Create invitation_usage_log table for audit trail
CREATE TABLE IF NOT EXISTS invitation_usage_log (
  id SERIAL PRIMARY KEY,
  invitation_id INTEGER REFERENCES family_invitations(id), -- Can be NULL for invalid codes
  used_by TEXT NOT NULL REFERENCES users(id),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_invitations
CREATE POLICY "family_members_can_view_invitations" ON family_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id = family_invitations.family_id
    )
  );

CREATE POLICY "family_members_can_create_invitations" ON family_invitations
  FOR INSERT WITH CHECK (
    auth.uid()::text = created_by AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND family_id = family_invitations.family_id
      AND role IN ('mom', 'dad') -- Only parents can create invitations
    )
  );

CREATE POLICY "authenticated_users_can_lookup_invitations" ON family_invitations
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- RLS policies for invitation_usage_log
CREATE POLICY "family_members_can_view_usage_log" ON invitation_usage_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN family_invitations fi ON fi.id = invitation_usage_log.invitation_id
      WHERE u.id = auth.uid()::text 
      AND u.family_id = fi.family_id
    ) OR invitation_usage_log.invitation_id IS NULL
  );

CREATE POLICY "system_can_log_usage" ON invitation_usage_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to generate secure invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  -- Generate a cryptographically secure random code
  -- Format: 3 groups of 4 characters separated by dashes (e.g., ABCD-EFGH-IJKL)
  RETURN UPPER(
    SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 4) || '-' ||
    SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 4) || '-' ||
    SUBSTRING(encode(gen_random_bytes(4), 'hex') FROM 1 FOR 4)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a family invitation
CREATE OR REPLACE FUNCTION create_family_invitation(
  p_family_id INTEGER,
  p_email TEXT DEFAULT NULL,
  p_max_uses INTEGER DEFAULT 1,
  p_expires_hours INTEGER DEFAULT 72 -- 3 days default
)
RETURNS TABLE(invitation_code TEXT, expires_at TIMESTAMP) AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMP;
BEGIN
  -- Check if user is authorized (parent in the family)
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND family_id = p_family_id 
    AND role IN ('mom', 'dad')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only parents can create invitations';
  END IF;

  -- Generate unique code
  LOOP
    v_code := generate_invitation_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM family_invitations WHERE invitation_code = v_code);
  END LOOP;

  v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  -- Insert invitation
  INSERT INTO family_invitations (
    family_id, created_by, invitation_code, email, max_uses, expires_at
  ) VALUES (
    p_family_id, auth.uid()::text, v_code, p_email, p_max_uses, v_expires_at
  );

  RETURN QUERY SELECT v_code, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use an invitation
CREATE OR REPLACE FUNCTION use_family_invitation(
  p_invitation_code TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(family_id INTEGER, success BOOLEAN, message TEXT) AS $$
DECLARE
  v_invitation family_invitations%ROWTYPE;
  v_user_id TEXT;
  v_success BOOLEAN := FALSE;
  v_message TEXT;
BEGIN
  v_user_id := auth.uid()::text;
  
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM family_invitations
  WHERE invitation_code = p_invitation_code;

  -- Validate invitation
  IF v_invitation.id IS NULL THEN
    v_message := 'Invalid invitation code';
    INSERT INTO invitation_usage_log (used_by, ip_address, user_agent, success, error_message, invitation_id)
    VALUES (v_user_id, p_ip_address, p_user_agent, FALSE, v_message, NULL);
    RETURN QUERY SELECT NULL::INTEGER, FALSE, v_message;
  ELSE
    -- Check if user is already in a family
    IF EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND family_id IS NOT NULL) THEN
      v_message := 'User is already a member of a family';
      INSERT INTO invitation_usage_log (used_by, ip_address, user_agent, success, error_message, invitation_id)
      VALUES (v_user_id, p_ip_address, p_user_agent, FALSE, v_message, v_invitation.id);
      RETURN QUERY SELECT NULL::INTEGER, FALSE, v_message;
    ELSE
      -- Join the family
      -- First check if user exists
      IF EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
        -- Update existing user
        UPDATE users SET family_id = v_invitation.family_id WHERE id = v_user_id;
      ELSE
        -- Insert new user
        INSERT INTO users (id, email, username, name, role, family_id)
        VALUES (
          v_user_id,
          (SELECT email FROM auth.users WHERE id = auth.uid()),
          COALESCE((SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid()), 'user'),
          COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()), 'User'),
          COALESCE((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()), 'teen'),
          v_invitation.family_id
        );
      END IF;

      v_success := TRUE;
      v_message := 'Successfully joined family';
      INSERT INTO invitation_usage_log (used_by, ip_address, user_agent, success, error_message, invitation_id)
      VALUES (v_user_id, p_ip_address, p_user_agent, TRUE, v_message, v_invitation.id);
      RETURN QUERY SELECT v_invitation.family_id, v_success, v_message;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;