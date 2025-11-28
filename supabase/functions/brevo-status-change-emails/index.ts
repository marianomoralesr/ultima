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
  const baseUrl = 'https://trefa.mx';
  const applicationUrl = `${baseUrl}/escritorio/seguimiento`;
  const profileUrl = `${baseUrl}/escritorio/profile`;

  // Generate upload link if token exists
  const uploadLink = data.publicUploadToken
    ? `${baseUrl}/documentos/${data.publicUploadToken}`
    : applicationUrl;

  switch (status) {
    case 'Faltan Documentos':
      return {
        subject: '📄 Autos TREFA | Falta un paso para completar tu solicitud',
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
                <h1 class="title">¡Casi llegamos! 📄</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, tu solicitud está casi lista. Solo necesitamos algunos documentos.</p>

                ${data.vehicleTitle ? `
                <div class="card">
                  <p style="font-size: 14px; font-weight: 600; color: #556675; margin-bottom: 8px;">TU AUTO</p>
                  <p style="font-size: 18px; font-weight: 600; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">📋 Documentos que necesitamos:</h2>
                <ul>
                  <li><strong>INE</strong> (frente y reverso)</li>
                  <li><strong>Comprobante de domicilio</strong> (no mayor a 3 meses)</li>
                  <li><strong>Comprobantes de ingresos</strong> (últimos 3 meses)</li>
                  <li><strong>Constancia de Situación Fiscal</strong></li>
                </ul>

                <div style="background: #E0F2FE; border-left: 4px solid #0369A1; padding: 20px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0; color: #0C4A6E; font-size: 15px; line-height: 1.6;">
                    <strong>✨ Súper fácil:</strong> Puedes subir tus documentos desde tu celular. Solo toma fotos claras y súbelas directamente desde el enlace de abajo.
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${uploadLink}" class="button">📱 Subir Documentos Ahora</a>
                </div>

                <p style="font-size: 14px; color: #556675; background: #FEF3C7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                  <strong>💡 ¿Necesitas ayuda?</strong><br>
                  Si tienes dudas sobre qué documentos subir, contáctanos por WhatsApp o responde este email. ¡Estamos para ayudarte!
                </p>

                <p style="font-size: 15px; color: #374151; text-align: center; margin: 32px 0;">
                  Tu auto está esperando por ti 🚗💨
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
        subject: '✅ Autos TREFA | ¡Solicitud Completa! - Estamos revisándola',
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
                <h1 class="title">¡Excelente! Todo está en orden ✅</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, recibimos toda tu documentación. Ahora viene lo emocionante.</p>

                ${data.vehicleTitle ? `
                <div class="card" style="background: linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%); border-left-color: #16A34A;">
                  <p style="font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px;">TU AUTO</p>
                  <p style="font-size: 20px; font-weight: 700; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">🎯 ¿Qué sigue ahora?</h2>
                <ul>
                  <li><strong>Revisión de documentos:</strong> Nuestro equipo verificará toda tu información (1-2 días hábiles)</li>
                  <li><strong>Análisis crediticio:</strong> Evaluaremos tu solicitud con el banco (2-3 días hábiles)</li>
                  <li><strong>Te contactaremos:</strong> Te avisaremos en cuanto tengamos noticias</li>
                </ul>

                <div style="background: #DCFCE7; border-left: 4px solid #16A34A; padding: 20px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">
                    <strong>⏱️ Respuesta rápida:</strong> El 95% de nuestros clientes reciben una respuesta en menos de 48 horas hábiles. ¡Mantente al pendiente!
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${applicationUrl}" class="button">📊 Ver mi Solicitud</a>
                </div>

                <p style="font-size: 15px; color: #374151; text-align: center; margin: 32px 0; line-height: 1.8;">
                  ¡Estamos muy emocionados de ayudarte a conseguir tu auto! 🎉
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
        subject: '🔍 Autos TREFA | Tu solicitud está en revisión',
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
                <h1 class="title">¡Estamos trabajando en tu solicitud! 🔍</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, tu solicitud está siendo revisada por nuestro equipo y el banco.</p>

                ${data.vehicleTitle ? `
                <div class="card" style="background: linear-gradient(135deg, #E0E7FF 0%, #EEF2FF 100%); border-left-color: #6366F1;">
                  <p style="font-size: 14px; font-weight: 600; color: #4338CA; margin-bottom: 8px;">TU AUTO</p>
                  <p style="font-size: 20px; font-weight: 700; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">📝 Proceso de Revisión</h2>
                <ul>
                  <li><strong>Análisis detallado:</strong> Estamos revisando cuidadosamente tu información</li>
                  <li><strong>Verificación bancaria:</strong> Trabajamos con las instituciones financieras</li>
                  <li><strong>Pronto tendrás noticias:</strong> Te contactaremos para actualizar tu estado</li>
                </ul>

                <div style="background: #EEF2FF; border-left: 4px solid #6366F1; padding: 20px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0; color: #4338CA; font-size: 15px; line-height: 1.6;">
                    <strong>💪 Mantente tranquilo:</strong> Este es un paso normal del proceso. Si necesitamos algo adicional, te contactaremos de inmediato.
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${applicationUrl}" class="button">📊 Ver Estado</a>
                </div>

                <p style="font-size: 15px; color: #374151; text-align: center; margin: 32px 0;">
                  Cada día estás más cerca de tu auto 🚗✨
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
        subject: '🎉 ¡FELICIDADES! Tu crédito fue aprobado - Autos TREFA',
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
                <h1 class="title">🎉 ¡FELICIDADES! ¡Tu crédito fue aprobado!</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, tenemos noticias increíbles. Tu solicitud ha sido <strong style="color: #16A34A;">APROBADA</strong>.</p>

                ${data.vehicleTitle ? `
                <div class="card" style="border-left-color: #16A34A; background: linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%); border: 2px solid #16A34A;">
                  <p style="font-size: 14px; font-weight: 600; color: #166534; margin-bottom: 8px;">🏆 TU AUTO APROBADO</p>
                  <p style="font-size: 24px; font-weight: 700; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">🚀 Próximos Pasos</h2>
                <ul>
                  <li><strong>Agenda tu visita:</strong> Reserva una cita para conocer tu auto en persona</li>
                  <li><strong>Firma de contrato:</strong> Completaremos los últimos detalles del financiamiento</li>
                  <li><strong>¡Estrena tu auto!</strong> En poco tiempo estarás manejándolo</li>
                </ul>

                <div style="background: linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%); border-left: 4px solid #16A34A; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
                  <p style="margin: 0 0 16px 0; color: #166534; font-size: 18px; line-height: 1.6; font-weight: 600;">
                    🎊 ¡Estás a UN PASO de tu nuevo auto! 🎊
                  </p>
                  <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.6;">
                    Nuestro equipo se pondrá en contacto contigo en las próximas 24 horas para coordinar todo.
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${baseUrl}/contacto" class="button">📅 Contactar para Agendar</a>
                </div>

                <p style="font-size: 16px; color: #374151; text-align: center; margin: 32px 0; line-height: 1.8;">
                  ¡Gracias por confiar en nosotros! 🙌
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
        subject: 'Autos TREFA | Actualización sobre tu solicitud',
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
                <h1 class="title">Actualización sobre tu solicitud</h1>
                <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, lamentamos informarte que en este momento no pudimos aprobar tu solicitud de financiamiento.</p>

                ${data.vehicleTitle ? `
                <div class="card">
                  <p style="font-size: 14px; font-weight: 600; color: #556675; margin-bottom: 8px;">AUTO SOLICITADO</p>
                  <p style="font-size: 18px; font-weight: 600; color: #0B2540; margin: 0;">${data.vehicleTitle}</p>
                </div>
                ` : ''}

                <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; margin-top: 32px;">💪 No te desanimes, hay opciones</h2>
                <ul>
                  <li><strong>Consulta personalizada:</strong> Agenda una cita con uno de nuestros asesores financieros</li>
                  <li><strong>Opciones alternativas:</strong> Podemos explorar otras formas de financiamiento</li>
                  <li><strong>Mejora tu perfil:</strong> Te orientamos para fortalecer tu solicitud futura</li>
                  <li><strong>Autos accesibles:</strong> Conoce opciones con diferentes planes de pago</li>
                </ul>

                <div style="background: #E0F2FE; border-left: 4px solid #0369A1; padding: 20px; border-radius: 12px; margin: 24px 0;">
                  <p style="margin: 0; color: #0C4A6E; font-size: 15px; line-height: 1.6;">
                    <strong>💙 Estamos contigo:</strong> No te rindas. Hay opciones para ti y queremos ayudarte a encontrar la mejor solución. Contáctanos y exploremos alternativas juntos.
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${baseUrl}/contacto" class="button">💬 Hablar con un Asesor</a>
                </div>

                <p style="font-size: 15px; color: #374151; text-align: center; margin: 32px 0;">
                  Siempre habrá una manera. ¡No te rindas! 💪
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
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Only send emails for specific status changes (using modern status values)
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
    const publicUploadToken = record.public_upload_token || null;

    // Get email template
    const { subject, html } = getEmailTemplate(newStatus, {
      clientName,
      vehicleTitle,
      publicUploadToken
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
