-- Fix lead_reminders index with correct column name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_reminders_date_completed
ON lead_reminders(reminder_date)
WHERE is_completed = false;

COMMENT ON INDEX idx_lead_reminders_date_completed IS
'Optimiza queries de recordatorios pendientes';
