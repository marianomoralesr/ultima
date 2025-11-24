-- Migration: Create oauth_tokens table for persisting third-party OAuth tokens
-- Created: 2025-11-07
-- Purpose: Store Kommo and other OAuth integration tokens with automatic refresh capability

-- Create oauth_tokens table
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'kommo', 'google', 'facebook', etc.
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at BIGINT, -- Unix timestamp in milliseconds
    scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure only one token per provider
    CONSTRAINT unique_provider UNIQUE (provider)
);

-- Create index for fast provider lookups
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider);

-- Create index for expiration checks
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);

-- Add RLS policies
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access oauth_tokens (these are sensitive credentials)
-- Regular users should never see these tokens directly
CREATE POLICY "Service role can manage oauth tokens"
    ON oauth_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER oauth_tokens_updated_at
    BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_oauth_tokens_updated_at();

-- Insert initial Kommo token (if not exists)
-- This will be updated by the KommoService when tokens are refreshed
INSERT INTO oauth_tokens (provider, access_token, refresh_token, token_type, expires_at)
VALUES (
    'kommo',
    '', -- Will be populated from config on first use
    '', -- Will be populated from config on first use
    'Bearer',
    0 -- Expired, will trigger immediate refresh
)
ON CONFLICT (provider) DO NOTHING;

-- Grant permissions to authenticated users to call RPC functions
-- (The RPC functions will use service role internally to access the table)
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON TABLE oauth_tokens IS 'Stores OAuth access and refresh tokens for third-party integrations';
COMMENT ON COLUMN oauth_tokens.provider IS 'Integration provider name (e.g., kommo, google, facebook)';
COMMENT ON COLUMN oauth_tokens.access_token IS 'Current OAuth access token';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'OAuth refresh token for obtaining new access tokens';
COMMENT ON COLUMN oauth_tokens.expires_at IS 'Unix timestamp (ms) when the access token expires';
