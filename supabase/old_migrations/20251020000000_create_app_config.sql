CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSONB
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON app_config FOR SELECT USING (true);
CREATE POLICY "Enable insert for admins" ON app_config FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Enable update for admins" ON app_config FOR UPDATE USING (auth.role() = 'service_role');
