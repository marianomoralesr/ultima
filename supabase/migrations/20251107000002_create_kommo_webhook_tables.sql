-- Migration: Create tables for Kommo webhook integration
-- Created: 2025-11-07
-- Purpose: Store Kommo leads and webhook event logs

-- Create kommo_leads table to store lead data from Kommo CRM
CREATE TABLE IF NOT EXISTS kommo_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kommo_id BIGINT NOT NULL UNIQUE, -- Kommo lead ID
    name TEXT NOT NULL,
    status_id INTEGER,
    pipeline_id INTEGER,
    responsible_user_id INTEGER,
    price DECIMAL(10, 2) DEFAULT 0,
    event_type TEXT, -- 'created', 'updated', 'status_changed', 'deleted'
    is_deleted BOOLEAN DEFAULT FALSE,
    raw_data JSONB, -- Full Kommo lead data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT kommo_leads_kommo_id_key UNIQUE (kommo_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_kommo_leads_kommo_id ON kommo_leads(kommo_id);
CREATE INDEX IF NOT EXISTS idx_kommo_leads_pipeline_status ON kommo_leads(pipeline_id, status_id);
CREATE INDEX IF NOT EXISTS idx_kommo_leads_is_deleted ON kommo_leads(is_deleted);

-- Create kommo_webhook_logs table for debugging and monitoring
CREATE TABLE IF NOT EXISTS kommo_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB,
    results JSONB,
    status TEXT, -- 'success', 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for log queries
CREATE INDEX IF NOT EXISTS idx_kommo_webhook_logs_created_at ON kommo_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kommo_webhook_logs_event_type ON kommo_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_kommo_webhook_logs_status ON kommo_webhook_logs(status);

-- Add RLS policies
ALTER TABLE kommo_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE kommo_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage all data
CREATE POLICY "Service role can manage kommo_leads"
    ON kommo_leads
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage kommo_webhook_logs"
    ON kommo_webhook_logs
    FOR ALL
    USING (auth.role() = 'service_role');

-- Authenticated users can read leads
CREATE POLICY "Authenticated users can read kommo_leads"
    ON kommo_leads
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kommo_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER kommo_leads_updated_at
    BEFORE UPDATE ON kommo_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_kommo_leads_updated_at();

-- Comments
COMMENT ON TABLE kommo_leads IS 'Stores lead data synced from Kommo CRM via webhooks';
COMMENT ON TABLE kommo_webhook_logs IS 'Logs all webhook events from Kommo for debugging and monitoring';
COMMENT ON COLUMN kommo_leads.kommo_id IS 'The lead ID from Kommo CRM';
COMMENT ON COLUMN kommo_leads.event_type IS 'Type of last event: created, updated, status_changed, responsible_changed, deleted';
COMMENT ON COLUMN kommo_leads.raw_data IS 'Full JSON payload from Kommo webhook for reference';
