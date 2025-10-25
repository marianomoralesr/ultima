-- Configure Database Settings for Email Notifications
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

-- Set Supabase URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://jjepfehmuybpctdzipnu.supabase.co';

-- Set Supabase Anon Key
ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTk2MDMsImV4cCI6MjA1OTc3NTYwM30.yaMESZqaoLvkbVSgdHxpU-Vb7q-naxj95QxcpRYPrX4';

-- Verify the settings were applied
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'app.settings.%';
