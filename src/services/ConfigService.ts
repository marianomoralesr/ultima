import { supabase } from '../../supabaseClient';

class ConfigService {
  static async setupConfigTable() {
    const { error } = await supabase.rpc('run_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS app_config (
          key TEXT PRIMARY KEY,
          value JSONB
        );
        ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
        DO
        $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users') THEN
            CREATE POLICY "Enable read access for all users" ON app_config FOR SELECT USING (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for admins') THEN
            CREATE POLICY "Enable insert for admins" ON app_config FOR INSERT WITH CHECK (auth.role() = 'service_role');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for admins') THEN
            CREATE POLICY "Enable update for admins" ON app_config FOR UPDATE USING (auth.role() = 'service_role');
          END IF;
        END
        $$;
      `,
    });

    if (error) {
      console.error('Error setting up config table:', error);
    }
  }
}

export default ConfigService;
