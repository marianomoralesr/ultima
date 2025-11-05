import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Drop the old restrictive policy
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: `DROP POLICY IF EXISTS "Allow service role to insert notifications" ON public.user_email_notifications;`
    });

    if (dropError) {
      return new Response(JSON.stringify({ error: dropError }), { status: 500 });
    }

    // Create new permissive policy for all roles
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE POLICY IF NOT EXISTS "Allow Edge Functions to insert notifications"
          ON public.user_email_notifications
          FOR INSERT
          TO anon, authenticated, service_role
          WITH CHECK (true);
      `
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'RLS policy updated successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
