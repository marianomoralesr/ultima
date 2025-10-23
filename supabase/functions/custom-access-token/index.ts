import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Custom Access Token Hook function started")

serve(async (req) => {
  try {
    const { user, claims } = await req.json()

    console.log(`Processing JWT claims for user: ${user.id}`)

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables - defaulting to user role')
      // Don't block auth, just default to user role
      return new Response(
        JSON.stringify({
          claims: {
            ...claims,
            user_role: 'user'
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch user profile role from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      // Default to 'user' role if profile not found - DON'T BLOCK AUTH
      return new Response(
        JSON.stringify({
          claims: {
            ...claims,
            user_role: 'user'
          }
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      )
    }

    const userRole = profile?.role || 'user'
    console.log(`Successfully set user_role claim to: ${userRole}`)

    // Return the claims with the user_role added
    return new Response(
      JSON.stringify({
        claims: {
          ...claims,
          user_role: userRole
        }
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )
  } catch (error) {
    console.error('CRITICAL ERROR in custom-access-token hook:', error)
    // ALWAYS return claims even on error - NEVER block authentication
    return new Response(
      JSON.stringify({
        claims: {
          user_role: 'user' // Safe fallback
        }
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200 // MUST return 200 to not block auth
      }
    )
  }
})
