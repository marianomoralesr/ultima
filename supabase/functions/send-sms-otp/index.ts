import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = "+18147032022";

interface RequestBody {
  phone: string;
  otp: string;
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
    const { phone, otp }: RequestBody = await req.json();

    // Validar entrada
    if (!phone || !otp) {
      return new Response(
        JSON.stringify({
          error: "Teléfono y código OTP son requeridos",
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

    console.log(`📱 Enviando SMS a: ${formattedPhone}`);

    // Crear mensaje
    const message = `Tu código de verificación TREFA es: ${otp}\n\nEste código expira en 10 minutos.\n\nSi no solicitaste este código, ignora este mensaje.`;

    // Enviar SMS usando Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("From", TWILIO_PHONE_NUMBER);
    formData.append("Body", message);

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
      console.error("❌ Error de Twilio:", errorData);
      return new Response(
        JSON.stringify({
          error: "No se pudo enviar el SMS",
          details: errorData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("✅ SMS enviado exitosamente:", data.sid);

    // Registrar el envío en Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Guardar el OTP en la base de datos
    const { error: dbError } = await supabase
      .from("sms_otp_codes")
      .insert({
        phone: formattedPhone,
        otp_code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        twilio_message_sid: data.sid,
      });

    if (dbError) {
      console.error("⚠️ Error guardando OTP en DB:", dbError);
      // No fallar el request si no se pudo guardar en DB
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS enviado exitosamente",
        messageSid: data.sid,
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
