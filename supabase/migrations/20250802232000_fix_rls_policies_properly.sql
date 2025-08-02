-- Fix RLS policies properly to work with Supabase authentication flow
-- The issue is that we need to allow authenticated users to perform necessary operations
-- while still maintaining security

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their family" ON families;
DROP POLICY IF EXISTS "Users can view families by code" ON families;
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;

-- Create proper RLS policies for users table
-- Allow users to select their own profile OR allow any authenticated user to check if a profile exists
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    auth.uid()::text = id OR 
    (auth.uid() IS NOT NULL AND id = auth.uid()::text)
  );

-- Allow users to insert their own profile
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Create proper RLS policies for families table
-- Allow users to view families they belong to OR any family when looking up by code
CREATE POLICY "families_select_policy" ON families
  FOR SELECT USING (
    -- Users can see their own family
    id IN (SELECT family_id FROM users WHERE id = auth.uid()::text) OR
    -- Authenticated users can look up families by code for joining
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to create families
CREATE POLICY "families_insert_policy" ON families
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow family members to update their family
CREATE POLICY "families_update_policy" ON families
  FOR UPDATE USING (
    id IN (SELECT family_id FROM users WHERE id = auth.uid()::text)
  );