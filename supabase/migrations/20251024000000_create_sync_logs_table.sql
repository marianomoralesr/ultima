-- Create sync_logs table for monitoring Airtable sync operations
-- This table tracks all sync events, successes, and failures

CREATE TABLE IF NOT EXISTS public.sync_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Sync metadata
  record_id TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('webhook', 'bulk', 'manual')),
  source TEXT DEFAULT 'airtable_automation',

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message TEXT,
  error_details JSONB,

  -- Request metadata
  attempt_number INTEGER DEFAULT 1,
  duration_ms INTEGER,
  http_status INTEGER,

  -- Vehicle data (for quick reference)
  vehicle_title TEXT,
  ordencompra TEXT,
  ordenstatus TEXT,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Indexes for common queries
  CONSTRAINT sync_logs_record_id_created_at_key UNIQUE (record_id, created_at)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_record_id ON public.sync_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs (status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON public.sync_logs (sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_ordencompra ON public.sync_logs (ordencompra);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sync_logs_status_created_at ON public.sync_logs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_record_status ON public.sync_logs (record_id, status);

-- RLS Policies
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access to sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Service role full access to sync logs" ON public.sync_logs;

-- Allow anonymous read access to sync logs (for monitoring dashboard)
CREATE POLICY "Allow anonymous read access to sync logs"
  ON public.sync_logs
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role full access to sync logs"
  ON public.sync_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE public.sync_logs IS 'Tracks all Airtable to Supabase sync operations for monitoring and debugging';
COMMENT ON COLUMN public.sync_logs.record_id IS 'Airtable record ID that was synced';
COMMENT ON COLUMN public.sync_logs.sync_type IS 'Type of sync: webhook (real-time), bulk (batch), or manual';
COMMENT ON COLUMN public.sync_logs.status IS 'Outcome: success, error, or warning';
COMMENT ON COLUMN public.sync_logs.duration_ms IS 'Time taken to complete sync operation in milliseconds';
COMMENT ON COLUMN public.sync_logs.metadata IS 'Additional context data (attempts, cache invalidation, etc.)';

-- Create a view for recent sync statistics
CREATE OR REPLACE VIEW public.sync_stats AS
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  sync_type,
  status,
  COUNT(*) AS count,
  AVG(duration_ms)::INTEGER AS avg_duration_ms,
  MIN(duration_ms) AS min_duration_ms,
  MAX(duration_ms) AS max_duration_ms,
  COUNT(DISTINCT record_id) AS unique_records
FROM public.sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at), sync_type, status
ORDER BY hour DESC;

COMMENT ON VIEW public.sync_stats IS 'Hourly aggregated sync statistics for the last 7 days';

-- Create function to clean up old logs (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sync_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_sync_logs IS 'Deletes sync logs older than 30 days. Returns number of deleted rows.';

-- Grant access
GRANT SELECT ON public.sync_logs TO anon, authenticated;
GRANT SELECT ON public.sync_stats TO anon, authenticated;
GRANT ALL ON public.sync_logs TO service_role;
