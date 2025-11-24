-- Add PIN field to bank_representative_profiles table
-- PIN will be used for secure actions like updating applications and downloading documents

ALTER TABLE bank_representative_profiles
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_salt TEXT,
ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN bank_representative_profiles.pin_hash IS 'Hashed PIN for secure actions (4-6 digits)';
COMMENT ON COLUMN bank_representative_profiles.pin_salt IS 'Salt used for PIN hashing';
COMMENT ON COLUMN bank_representative_profiles.pin_set_at IS 'Timestamp when PIN was last set/updated';
COMMENT ON COLUMN bank_representative_profiles.has_completed_onboarding IS 'Whether bank rep has completed onboarding';
