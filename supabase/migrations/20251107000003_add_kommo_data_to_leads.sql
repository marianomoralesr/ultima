-- Add Kommo data fields to leads table
-- This stores the last synced Kommo lead data for display on profile pages

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS kommo_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kommo_last_synced TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster queries on leads with Kommo data
CREATE INDEX IF NOT EXISTS idx_leads_kommo_synced ON leads(kommo_last_synced) WHERE kommo_data IS NOT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN leads.kommo_data IS 'Stores last synced Kommo lead data: {kommo_id, pipeline_id, pipeline_name, status_id, status_name, responsible_user_id, price, tags[]}';
COMMENT ON COLUMN leads.kommo_last_synced IS 'Timestamp of last successful Kommo sync';
