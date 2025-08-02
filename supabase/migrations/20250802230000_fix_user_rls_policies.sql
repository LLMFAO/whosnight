-- Fix RLS policies for users table to handle initial profile queries
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create more permissive policies that handle the initial auth flow
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (
    auth.uid()::text = id OR 
    auth.uid() IS NOT NULL  -- Allow authenticated users to query for their profile existence
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Also update families policy to be more permissive for family code lookups
DROP POLICY IF EXISTS "Users can view their family" ON families;
DROP POLICY IF EXISTS "Users can view families by code" ON families;

CREATE POLICY "Users can view their family" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM users WHERE id = auth.uid()::text) OR
    auth.uid() IS NOT NULL  -- Allow authenticated users to look up families by code
  );

CREATE POLICY "Authenticated users can create families" ON families
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);