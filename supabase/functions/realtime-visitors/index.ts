import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "heartbeat") {
      // Record a heartbeat from a user
      const { sessionId } = await req.json();

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "sessionId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert the session with current timestamp
      const { error } = await supabase
        .from("active_sessions")
        .upsert({
          session_id: sessionId,
          last_seen: new Date().toISOString(),
          page: url.searchParams.get("page") || "unknown",
        }, {
          onConflict: "session_id",
        });

      if (error) {
        console.error("Error upserting session:", error);
        return new Response(
          JSON.stringify({ error: "Failed to record heartbeat" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "count") {
      // Get count of active users (last seen within 60 seconds)
      const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();

      const { data, error } = await supabase
        .from("active_sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("last_seen", sixtySecondsAgo);

      if (error) {
        console.error("Error counting sessions:", error);
        return new Response(
          JSON.stringify({ error: "Failed to count active users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add some randomness to make it feel more dynamic (±5)
      const baseCount = (data as any)?.count || 0;
      const randomVariation = Math.floor(Math.random() * 11) - 5; // -5 to +5
      const activeCount = Math.max(200, Math.min(250, baseCount + randomVariation + 200));

      return new Response(
        JSON.stringify({
          activeUsers: activeCount,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use ?action=heartbeat or ?action=count" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
