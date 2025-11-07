-- Add Kommo data fields to profiles table
-- This stores the last synced Kommo lead data for display on profile pages

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS kommo_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kommo_last_synced TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster queries on profiles with Kommo data
CREATE INDEX IF NOT EXISTS idx_profiles_kommo_synced ON profiles(kommo_last_synced) WHERE kommo_data IS NOT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN profiles.kommo_data IS 'Stores last synced Kommo lead data: {kommo_id, pipeline_id, pipeline_name, status_id, status_name, responsible_user_id, price, tags[]}';
COMMENT ON COLUMN profiles.kommo_last_synced IS 'Timestamp of last successful Kommo sync';
