-- This migration fixes critical Row Level Security (RLS) vulnerabilities that
-- allowed any authenticated user to read all user, family, and invitation data.

-- Step 1: Fix the 'users' table RLS policy.
-- Drop the dangerously permissive SELECT policy.
DROP POLICY IF EXISTS "users_select" ON users;

-- Create a new, secure policy.
-- This policy allows users to see their own data and the data of other users
-- ONLY if they belong to the same family.
CREATE POLICY "users_can_select_own_family_members" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
      -- Allow users to see their own record
      id = auth.uid()::text OR
      -- Allow users to see others in the same family
      family_id IN (SELECT family_id FROM users WHERE id = auth.uid()::text AND family_id IS NOT NULL)
    )
  );

-- Step 2: Fix the 'families' table RLS policy.
-- Drop the dangerously permissive SELECT policy.
DROP POLICY IF EXISTS "families_select" ON families;
DROP POLICY IF EXISTS "families_select_for_join" ON families; -- This one was also insecure.

-- Create a new, secure policy.
-- This policy allows a user to see ONLY their own family's record.
-- Looking up a family to join should be handled by a SECURITY DEFINER function,
-- not by exposing the entire table.
CREATE POLICY "families_can_select_own_family" ON families
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    id IN (SELECT family_id FROM users WHERE id = auth.uid()::text AND family_id IS NOT NULL)
  );

-- Step 3: Fix the 'family_invitations' table RLS policy.
-- Drop the dangerously permissive SELECT policy that exposed all invitation codes.
DROP POLICY IF EXISTS "authenticated_users_can_lookup_invitations" ON family_invitations;

-- The existing policy "family_members_can_view_invitations" is sufficient for family members
-- to see their own invitations. Non-family members should NOT be able to browse invitations.
-- They should use the `use_family_invitation` function which provides a secure way
-- to redeem a code without leaking data.

-- No new policy is needed here, just the removal of the insecure one.

-- Step 4: Review and confirm other policies are still appropriate.
-- The INSERT and UPDATE policies from previous migrations are generally reasonable
-- and are left in place. This migration focuses on fixing the critical data leaks
-- caused by the SELECT policies.
