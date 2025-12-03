import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SERVICE_SID = Deno.env.get("TWILIO_VERIFY_SERVICE_SID") || "VA6d44c2df0a37c44bcc5f087b3868e12d";

interface RequestBody {
  phone: string;
  code: string;
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validar que las credenciales de Twilio estén configuradas
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error("❌ Credenciales de Twilio no configuradas");
      return new Response(
        JSON.stringify({
          error: "Configuración de SMS no disponible",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { phone, code }: RequestBody = await req.json();

    // Validar entrada
    if (!phone || !code) {
      return new Response(
        JSON.stringify({
          error: "Teléfono y código son requeridos",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Formatear número de teléfono (asegurar que tenga +52 para México)
    let formattedPhone = phone.replace(/\D/g, ""); // Remover caracteres no numéricos
    if (formattedPhone.length === 10) {
      formattedPhone = `+52${formattedPhone}`;
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`;
    }

    console.log(`🔐 Verificando código para: ${formattedPhone}`);

    // Usar Twilio Verify API para verificar el código
    const twilioUrl = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("Code", code);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Error de Twilio Verify:", errorData);
      return new Response(
        JSON.stringify({
          error: "Error al verificar el código",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("✅ Verificación completada:", data.status);

    // Verificar si el código es válido
    if (data.status !== "approved") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Código inválido o expirado",
          status: data.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Código verificado exitosamente",
        status: data.status,
        valid: data.valid,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error general:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
