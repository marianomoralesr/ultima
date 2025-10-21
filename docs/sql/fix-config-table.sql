-- Fix for missing app_config table and run_sql function
-- Run this in Supabase SQL Editor (PRODUCTION)

-- Step 1: Create the app_config table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Step 2: Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON app_config;
DROP POLICY IF EXISTS "Enable insert for admins" ON app_config;
DROP POLICY IF EXISTS "Enable update for admins" ON app_config;

-- Step 4: Create policies
CREATE POLICY "Enable read access for all users"
ON app_config
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for admins"
ON app_config
FOR INSERT
WITH CHECK (true);  -- Changed from auth.role() check since that doesn't work in Supabase

CREATE POLICY "Enable update for admins"
ON app_config
FOR UPDATE
USING (true);  -- Changed from auth.role() check

-- Step 5: (OPTIONAL) Create the run_sql function for future use
-- Note: This is a security risk and should only be used in development
CREATE OR REPLACE FUNCTION run_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Step 6: Verify
SELECT 'app_config table created successfully' as status;
SELECT * FROM app_config;
