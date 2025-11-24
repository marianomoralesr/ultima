-- Create table to track active sessions
CREATE TABLE IF NOT EXISTS active_sessions (
  session_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying of recent sessions
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON active_sessions(last_seen DESC);

-- Enable Row Level Security
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert/update their session (public access for tracking)
CREATE POLICY "Anyone can track sessions" ON active_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to cleanup old sessions (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Optional: Create a cron job to run cleanup every minute
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-old-sessions', '* * * * *', 'SELECT cleanup_old_sessions()');
