-- This migration completely removes the descoped "expenses" feature.
-- It drops the expenses table and all related RLS policies and permissions.

-- Step 1: Drop the RLS policies associated with the expenses table.
DROP POLICY IF EXISTS "Family members can view expenses" ON expenses;
DROP POLICY IF EXISTS "Family members can create expenses" ON expenses;
DROP POLICY IF EXISTS "Family members can update expenses" ON expenses;

-- Step 2: Drop the expenses table itself.
-- Using CASCADE will automatically remove any dependent objects like indexes.
DROP TABLE IF EXISTS expenses CASCADE;

-- Step 3: Remove the 'can_add_expenses' column from the 'teen_permissions' table.
-- First, check if the column exists to make the script runnable more than once.
DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='teen_permissions' and column_name='can_add_expenses')
  THEN
    ALTER TABLE "teen_permissions" DROP COLUMN "can_add_expenses";
  END IF;
END $$;

-- Step 4: Remove the 'expenses' type from the 'item_type' enum if it exists.
-- Note: Supabase migrations might not use a custom enum type for this, but if it
-- did, this would be the way to remove it. If 'item_type' is just a TEXT column,
-- this step is not necessary, but it is included for completeness.
-- Example of what it might look like (actual implementation may vary):
-- ALTER TYPE item_type REMOVE VALUE 'expenses';
-- For now, we will assume it's not a custom enum as it's not in the schema.
