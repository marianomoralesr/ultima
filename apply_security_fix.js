import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://jjepfehmuybpctdzipnu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHR6aXBudSIsInJvbGVzIjpbInNlcnZpY2Vfcm9sZSJdLCJpYXQiOjE2ODI2NTQ2NDUsImV4cCI6MTk0MTIxMDY0NX0.UJXbX5H1vX9j12K0G1b1x3rQ1g5c3F4Z2V5bHk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = readFileSync('./supabase/migrations/20251022100000_fix_increment_views_security.sql', 'utf8');

console.log('Applying security fix for increment_vehicle_views function...');

// Execute the SQL
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error applying fix:', error);
  console.log('\nPlease run this SQL manually in the Supabase SQL Editor:');
  console.log(sql);
  process.exit(1);
}

console.log('✅ Security fix applied successfully!');
console.log('The increment_vehicle_views function now uses SECURITY DEFINER.');
