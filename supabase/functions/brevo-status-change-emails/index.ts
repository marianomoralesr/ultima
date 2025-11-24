import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const getEmailTemplate = (status: string, data: Record<string, any>): { subject: string; html: string } => {
  const baseStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
      body { font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #F7F8FA; }
      .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
      .header { background: linear-gradient(135deg, #FF6801 0%, #F56100 100%); padding: 40px 20px; text-align: center; }
      .logo { max-width: 180px; height: auto; }
      .content { padding: 40px 30px; }
      .title { font-size: 28px; font-weight: 700; color: #0B2540; margin: 0 0 16px 0; }
      .subtitle { font-size: 16px; color: #556675; margin: 0 0 32px 0; line-height: 1.6; }
      .card { background-color: #F7F8FA; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #FF6801; }
      .button { display: inline-block; background: linear-gradient(135deg, #FF6801 0%, #F56100 100%); color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 6px rgba(255, 104, 1, 0.2); }
      .footer { background-color: #0B2540; color: #FFFFFF; padding: 32px 30px; text-align: center; }
      .footer-text { font-size: 14px; color: #CBD5E1; margin: 8px 0; }
      .highlight { color: #FF6801; font-weight: 600; }
      ul { padding-left: 20px; }
      li { margin: 12px 0; color: #374151; line-height: 1.6; }
    </style>
  `;

  const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/public-assets/logoblanco.png`;
  const baseUrl = SUPABASE_URL.replace('.supabase.co', '');
  const applicationUrl = `${baseUrl}/escritorio/mis-solicitudes`;

  // Status-specific templates
  switch (status) {
    case 'Faltan Documentos':
      return {
        subject: 'Autos TREFA | Documentos Faltantes - Acción Requerida',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Autos TREFA" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">📄 Faltan Documentos para tu Solicitud</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, para continuar con tu solicitud de financiamiento necesitamos algunos documentos adicionales.</p>

                ${data.vehicleTitle ? `
                <div class="card">
                  <p style="font-size: 14px; font-weight: 600; color: #556675; margin-bottom: 8px;">VEHÍCULO DE INTERÉS</p>
                  <p style="font-size: 18px; font-weight: 600; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">¿Qué necesitas hacer?</h2>
                <ul>
                  <li><strong>Verifica los documentos faltantes</strong> en tu panel de solicitud</li>
                  <li><strong>Sube los documentos requeridos</strong> en formato PDF o imagen</li>
                  <li><strong>Confirma que sean legibles</strong> y contengan toda la información necesaria</li>
                </ul>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${applicationUrl}" class="button">Subir Documentos</a>
                </div>

                <p style="font-size: 14px; color: #556675; background: #FEF3C7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                  💡 <strong>¿Necesitas ayuda?</strong><br>
                  Si tienes dudas sobre qué documentos subir, contáctanos por WhatsApp o responde este correo.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
                <p class="footer-text">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'Completa':
      return {
        subject: 'Autos TREFA | Solicitud Completa - En Proceso de Revisión',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Autos TREFA" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">✅ Tu Solicitud está Completa</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, tu solicitud de financiamiento está completa y lista para ser revisada.</p>

                ${data.vehicleTitle ? `
                <div class="card">
                  <p style="font-size: 14px; font-weight: 600; color: #556675; margin-bottom: 8px;">VEHÍCULO DE INTERÉS</p>
                  <p style="font-size: 18px; font-weight: 600; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">¿Qué sigue?</h2>
                <ul>
                  <li><strong>Revisión de Documentos:</strong> Nuestro equipo verificará toda tu información</li>
                  <li><strong>Análisis de Crédito:</strong> Evaluaremos tu solicitud con nuestras instituciones bancarias</li>
                  <li><strong>Respuesta Rápida:</strong> Recibirás una actualización en las próximas 24-48 horas</li>
                </ul>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${applicationUrl}" class="button">Ver mi Solicitud</a>
                </div>

                <p style="font-size: 14px; color: #556675; background: #DCFCE7; padding: 16px; border-radius: 8px; border-left: 4px solid #16A34A;">
                  ✅ <strong>Solicitud en proceso</strong><br>
                  Te notificaremos por correo cuando tengamos novedades.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
                <p class="footer-text">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'En Revisión':
      return {
        subject: 'Autos TREFA | Solicitud En Revisión',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Autos TREFA" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">🔍 Tu Solicitud está En Revisión</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, tu solicitud de financiamiento está siendo revisada por nuestro equipo.</p>

                ${data.vehicleTitle ? `
                <div class="card">
                  <p style="font-size: 14px; font-weight: 600; color: #556675; margin-bottom: 8px;">VEHÍCULO DE INTERÉS</p>
                  <p style="font-size: 18px; font-weight: 600; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">Proceso de Revisión</h2>
                <ul>
                  <li><strong>Análisis Detallado:</strong> Estamos revisando cuidadosamente tu información</li>
                  <li><strong>Verificación Bancaria:</strong> Trabajamos con las instituciones financieras</li>
                  <li><strong>Pronto tendrás noticias:</strong> Te contactaremos para actualizar tu estado</li>
                </ul>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${applicationUrl}" class="button">Ver mi Solicitud</a>
                </div>

                <p style="font-size: 14px; color: #556675; background: #E0F2FE; padding: 16px; border-radius: 8px; border-left: 4px solid #0369A1;">
                  💡 <strong>Mantente atento</strong><br>
                  Un asesor se pondrá en contacto contigo si necesitamos información adicional.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
                <p class="footer-text">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'Aprobada':
      return {
        subject: '🎉 Autos TREFA | ¡Felicidades! Tu Crédito fue Aprobado',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Autos TREFA" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">🎉 ¡Felicidades! Tu Crédito fue Aprobado</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, tenemos excelentes noticias. Tu solicitud de financiamiento ha sido <strong style="color: #16A34A;">APROBADA</strong>.</p>

                ${data.vehicleTitle ? `
                <div class="card" style="border-left-color: #16A34A; background: linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%);">
                  <p style="font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px;">TU VEHÍCULO APROBADO</p>
                  <p style="font-size: 20px; font-weight: 700; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">Próximos Pasos</h2>
                <ul>
                  <li><strong>Agenda tu Visita:</strong> Reserva una cita para conocer tu vehículo en persona</li>
                  <li><strong>Firma de Contrato:</strong> Completaremos los últimos detalles del financiamiento</li>
                  <li><strong>¡Estrena tu Auto!</strong> En poco tiempo estarás manejando tu nuevo vehículo</li>
                </ul>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${baseUrl}/agendar-cita" class="button">Agendar mi Cita</a>
                </div>

                <p style="font-size: 14px; color: #556675; background: #DCFCE7; padding: 16px; border-radius: 8px; border-left: 4px solid: #16A34A;">
                  ✅ <strong>¡Estás a un paso de tu nuevo auto!</strong><br>
                  Nuestro equipo se pondrá en contacto contigo para coordinar los detalles finales.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
                <p class="footer-text">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'Rechazada':
      return {
        subject: 'Autos TREFA | Actualización sobre tu Solicitud',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${logoUrl}" alt="Autos TREFA" class="logo" />
              </div>
              <div class="content">
                <h1 class="title">Actualización sobre tu Solicitud</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, lamentamos informarte que en este momento no pudimos aprobar tu solicitud de financiamiento.</p>

                ${data.vehicleTitle ? `
                <div class="card">
                  <p style="font-size: 14px; font-weight: 600; color: #556675; margin-bottom: 8px;">VEHÍCULO SOLICITADO</p>
                  <p style="font-size: 18px; font-weight: 600; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">¿Qué opciones tienes?</h2>
                <ul>
                  <li><strong>Consulta Personalizada:</strong> Agenda una cita con uno de nuestros asesores financieros</li>
                  <li><strong>Opciones Alternativas:</strong> Podemos explorar otras formas de financiamiento</li>
                  <li><strong>Mejora tu Perfil:</strong> Te orientamos para fortalecer tu solicitud futura</li>
                  <li><strong>Vehículos Accesibles:</strong> Conoce opciones con diferentes planes de pago</li>
                </ul>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${baseUrl}/agendar-cita" class="button">Hablar con un Asesor</a>
                </div>

                <p style="font-size: 14px; color: #556675; background: #E0F2FE; padding: 16px; border-radius: 8px; border-left: 4px solid #0369A1;">
                  💡 <strong>No te desanimes</strong><br>
                  Estamos aquí para ayudarte a encontrar la mejor solución para ti. Contáctanos y exploremos otras opciones juntos.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
                <p class="footer-text">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      return {
        subject: 'Autos TREFA | Actualización de tu Solicitud',
        html: ''
      };
  }
};

const sendBrevoEmail = async (to: string, toName: string, subject: string, htmlContent: string) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Autos TREFA',
        email: 'hola@trefa.mx'
      },
      to: [{
        email: to,
        name: toName
      }],
      subject: subject,
      htmlContent: htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
};

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body (comes from database trigger)
    const { record, old_record } = await req.json();

    if (!record) {
      return new Response(
        JSON.stringify({ error: 'Missing record in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newStatus = record.status;
    const oldStatus = old_record?.status;

    console.log(`Status change detected: ${oldStatus} -> ${newStatus} for application ${record.id}`);

    // Only send emails for specific status changes
    const notifiableStatuses = ['Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada'];

    if (!notifiableStatuses.includes(newStatus)) {
      return new Response(
        JSON.stringify({ message: `Status ${newStatus} does not trigger email notification`, applicationId: record.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Don't send email if status hasn't actually changed
    if (newStatus === oldStatus) {
      return new Response(
        JSON.stringify({ message: 'Status unchanged, no email sent', applicationId: record.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', record.user_id)
      .single();

    if (profileError || !profile || !profile.email) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found or missing email', applicationId: record.id }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare email data
    const clientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente';
    const vehicleTitle = record.car_info?._vehicleTitle || record.car_info?.vehicleTitle || null;

    // Get email template
    const { subject, html } = getEmailTemplate(newStatus, {
      clientName,
      vehicleTitle
    });

    // Send email
    await sendBrevoEmail(profile.email, clientName, subject, html);

    // Log email to database
    const { error: logError } = await supabase.from('user_email_notifications').insert({
      user_id: profile.id,
      email_type: `status_change_${newStatus.toLowerCase().replace(/ /g, '_')}`,
      subject: subject,
      sent_at: new Date().toISOString(),
      status: 'sent',
      metadata: {
        application_id: record.id,
        old_status: oldStatus,
        new_status: newStatus
      }
    });

    if (logError) {
      console.error('Failed to log email notification:', logError);
    }

    console.log(`Successfully sent ${newStatus} email to ${profile.email} for application ${record.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Status change email sent for ${newStatus}`,
        applicationId: record.id,
        recipientEmail: profile.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending status change email:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
