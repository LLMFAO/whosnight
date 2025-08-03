-- Fix RLS policy to allow family lookup by code for joining
-- This allows new users to look up families by code during the join process

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "families_select" ON families;

-- Create a more permissive policy that allows:
-- 1. Family members to view their own family
-- 2. ANY authenticated user to look up families by code (for joining)
CREATE POLICY "families_select_for_join" ON families
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Allow family members to see their family
      id IN (SELECT family_id FROM users WHERE id = auth.uid()::text AND family_id IS NOT NULL)
      OR
      -- Allow ANY authenticated user to look up families by code (needed for joining)
      auth.uid() IS NOT NULL
    )
  );

-- Also ensure users can be created during the join process
-- Drop existing user insert policy if it's too restrictive
DROP POLICY IF EXISTS "users_insert" ON users;

-- Create permissive user insert policy
CREATE POLICY "users_insert_for_registration" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    id = auth.uid()::text  -- User can only insert their own profile
  );