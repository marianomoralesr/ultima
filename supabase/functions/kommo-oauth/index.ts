import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const KOMMO_INTEGRATION_ID = Deno.env.get('KOMMO_INTEGRATION_ID') || '';
const KOMMO_SECRET_KEY = Deno.env.get('KOMMO_SECRET_KEY') || '';
const KOMMO_SUBDOMAIN = Deno.env.get('KOMMO_SUBDOMAIN') || '';
const KOMMO_REDIRECT_URI = Deno.env.get('KOMMO_REDIRECT_URI') || '';

interface KommoTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

interface OAuthToken {
  provider: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get-token';

    // Get current token from database
    const getTokenFromDB = async (): Promise<OAuthToken | null> => {
      const { data, error } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('provider', 'kommo')
        .single();

      if (error || !data) {
        console.error('[Kommo OAuth] Error loading token from database:', error);
        return null;
      }

      return data as OAuthToken;
    };

    // Save token to database
    const saveTokenToDB = async (tokenData: KommoTokenResponse): Promise<void> => {
      const expiresAt = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer

      const { error } = await supabase
        .from('oauth_tokens')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('provider', 'kommo');

      if (error) {
        console.error('[Kommo OAuth] Error saving token to database:', error);
        throw new Error('Failed to save token to database');
      }

      console.log('[Kommo OAuth] Token saved to database successfully');
    };

    // Refresh access token using refresh token
    const refreshAccessToken = async (refreshToken: string): Promise<KommoTokenResponse> => {
      console.log('[Kommo OAuth] Refreshing access token...');

      const payload = {
        client_id: KOMMO_INTEGRATION_ID,
        client_secret: KOMMO_SECRET_KEY,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        redirect_uri: KOMMO_REDIRECT_URI,
      };

      const response = await fetch(`https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Kommo OAuth] Token refresh failed:', errorData);
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: KommoTokenResponse = await response.json();
      console.log('[Kommo OAuth] Token refreshed successfully');

      // Save new token to database
      await saveTokenToDB(tokenData);

      return tokenData;
    };

    // Get valid token (refresh if needed)
    const getValidToken = async (): Promise<string> => {
      const tokenData = await getTokenFromDB();

      if (!tokenData) {
        throw new Error('No Kommo token found in database. Please authenticate first.');
      }

      // Check if token is expired or about to expire
      if (Date.now() >= tokenData.expires_at) {
        console.log('[Kommo OAuth] Token expired, refreshing...');
        const newTokenData = await refreshAccessToken(tokenData.refresh_token);
        return newTokenData.access_token;
      }

      return tokenData.access_token;
    };

    // Route: GET token
    if (action === 'get-token') {
      const accessToken = await getValidToken();

      return new Response(
        JSON.stringify({
          success: true,
          access_token: accessToken,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Route: Make authenticated API request to Kommo
    if (action === 'api-request') {
      const { endpoint, method = 'GET', body } = await req.json();

      if (!endpoint) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameter: endpoint' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      const accessToken = await getValidToken();
      const kommoUrl = `https://${KOMMO_SUBDOMAIN}.kommo.com/api/v4${endpoint}`;

      console.log(`[Kommo OAuth] Making ${method} request to ${endpoint}`);

      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(kommoUrl, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Kommo OAuth] API request failed:', errorData);

        return new Response(
          JSON.stringify({
            error: `Kommo API request failed: ${response.status}`,
            details: errorData,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: response.status,
          }
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      const data = await response.json();

      return new Response(
        JSON.stringify(data),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Invalid action
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use ?action=get-token or ?action=api-request' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );

  } catch (error: any) {
    console.error('[Kommo OAuth] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
