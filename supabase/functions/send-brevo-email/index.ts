import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EmailRequest {
  to: string;
  toName: string;
  subject: string;
  templateType: 'application_submitted' | 'status_changed' | 'document_status_changed';
  templateData: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any>): string => {
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
      .card-title { font-size: 14px; font-weight: 600; color: #556675; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
      .card-content { font-size: 16px; color: #0B2540; font-weight: 600; }
      .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 16px 0; }
      .status-submitted { background-color: #E0F2FE; color: #0369A1; }
      .status-reviewing { background-color: #FEF3C7; color: #B45309; }
      .status-approved { background-color: #D1FAE5; color: #065F46; }
      .status-rejected { background-color: #FEE2E2; color: #991B1B; }
      .status-pending_docs { background-color: #DBEAFE; color: #1E40AF; }
      .button { display: inline-block; background: linear-gradient(135deg, #FF6801 0%, #F56100 100%); color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 6px rgba(255, 104, 1, 0.2); }
      .button:hover { box-shadow: 0 6px 12px rgba(255, 104, 1, 0.3); }
      .footer { background-color: #0B2540; color: #FFFFFF; padding: 32px 30px; text-align: center; }
      .footer-text { font-size: 14px; color: #CBD5E1; margin: 8px 0; }
      .divider { height: 1px; background: linear-gradient(to right, transparent, #E5E7EB, transparent); margin: 32px 0; }
      .highlight { color: #FF6801; font-weight: 600; }
      ul { padding-left: 20px; }
      li { margin: 12px 0; color: #374151; line-height: 1.6; }
    </style>
  `;

  const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/public-assets/logoblanco.png`;

  switch (type) {
    case 'application_submitted':
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Trefa" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">¡Solicitud Recibida con Éxito!</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, hemos recibido tu solicitud de financiamiento y ya estamos trabajando en ella.</p>

              <div class="card">
                <div class="card-title">Resumen de tu Solicitud</div>
                <div class="card-content">
                  ${data.vehicleTitle ? `<p><strong>Vehículo:</strong> ${data.vehicleTitle}</p>` : ''}
                  <p><strong>Fecha de Solicitud:</strong> ${new Date(data.submittedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><strong>Estado:</strong> <span class="status-badge status-submitted">Enviada</span></p>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">¿Qué sigue?</h2>
              <ul>
                <li><strong>Revisión de Documentos:</strong> Nuestro equipo verificará la información proporcionada.</li>
                <li><strong>Evaluación:</strong> Analizaremos tu perfil crediticio y capacidad de pago.</li>
                <li><strong>Respuesta:</strong> Te contactaremos en las próximas 24-48 horas.</li>
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.statusUrl}" class="button">Ver Estado de mi Solicitud</a>
              </div>

              <p style="font-size: 14px; color: #556675; text-align: center; margin-top: 32px;">
                Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Trefa Autos</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Trefa. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'status_changed':
      const statusMessages: Record<string, { title: string; message: string; nextSteps: string[] }> = {
        reviewing: {
          title: 'Tu Solicitud está en Revisión',
          message: 'Nuestro equipo está analizando tu información detalladamente.',
          nextSteps: [
            'Estamos verificando tus documentos y datos proporcionados',
            'Evaluando tu perfil crediticio',
            'Te contactaremos si necesitamos información adicional'
          ]
        },
        pending_docs: {
          title: 'Documentos Pendientes',
          message: 'Necesitamos que completes algunos documentos para continuar con tu solicitud.',
          nextSteps: [
            'Revisa la lista de documentos requeridos en tu portal',
            'Sube los documentos faltantes lo antes posible',
            'Una vez recibidos, continuaremos con el proceso'
          ]
        },
        approved: {
          title: '¡Felicidades! Tu Solicitud fue Aprobada',
          message: 'Tu solicitud de financiamiento ha sido aprobada exitosamente.',
          nextSteps: [
            'Un asesor se pondrá en contacto contigo para finalizar detalles',
            'Revisa las condiciones de financiamiento en tu portal',
            'Prepara tu documentación para la firma del contrato'
          ]
        },
        rejected: {
          title: 'Actualización de tu Solicitud',
          message: 'Lamentablemente, no pudimos aprobar tu solicitud en este momento.',
          nextSteps: [
            'Puedes solicitar una revisión o más información sobre el motivo',
            'Te invitamos a mejorar tu perfil crediticio',
            'Podrás aplicar nuevamente en el futuro'
          ]
        }
      };

      const statusInfo = statusMessages[data.newStatus] || statusMessages.reviewing;
      const statusClass = `status-${data.newStatus}`;

      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Trefa" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">${statusInfo.title}</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, ${statusInfo.message}</p>

              <div class="card">
                <div class="card-title">Estado de tu Solicitud</div>
                <div class="card-content">
                  ${data.vehicleTitle ? `<p><strong>Vehículo:</strong> ${data.vehicleTitle}</p>` : ''}
                  <p><strong>Estado Anterior:</strong> ${data.oldStatus || 'N/A'}</p>
                  <p><strong>Nuevo Estado:</strong> <span class="status-badge ${statusClass}">${data.newStatusLabel || data.newStatus}</span></p>
                  <p><strong>Actualizado:</strong> ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">Próximos Pasos</h2>
              <ul>
                ${statusInfo.nextSteps.map(step => `<li>${step}</li>`).join('')}
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.statusUrl}" class="button">Ver Detalles de mi Solicitud</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Trefa Autos</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Trefa. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'document_status_changed':
      const docStatusMessages: Record<string, { title: string; message: string; icon: string }> = {
        approved: {
          title: 'Documento Aprobado',
          message: 'Tu documento ha sido revisado y aprobado exitosamente.',
          icon: '✅'
        },
        rejected: {
          title: 'Documento Requiere Atención',
          message: 'Tu documento necesita ser revisado y vuelto a cargar.',
          icon: '⚠️'
        },
        reviewing: {
          title: 'Documento en Revisión',
          message: 'Estamos revisando tu documento.',
          icon: '🔍'
        }
      };

      const docInfo = docStatusMessages[data.documentStatus] || docStatusMessages.reviewing;
      const docStatusClass = `status-${data.documentStatus}`;

      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Trefa" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">${docInfo.icon} ${docInfo.title}</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, ${docInfo.message}</p>

              <div class="card">
                <div class="card-title">Detalles del Documento</div>
                <div class="card-content">
                  <p><strong>Nombre del Documento:</strong> ${data.documentName}</p>
                  <p><strong>Tipo:</strong> ${data.documentType}</p>
                  <p><strong>Estado:</strong> <span class="status-badge ${docStatusClass}">${data.documentStatus === 'approved' ? 'Aprobado' : data.documentStatus === 'rejected' ? 'Rechazado' : 'En Revisión'}</span></p>
                  ${data.rejectionReason ? `<p><strong>Motivo:</strong> ${data.rejectionReason}</p>` : ''}
                </div>
              </div>

              ${data.documentStatus === 'rejected' ? `
              <div class="divider"></div>
              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">¿Qué hacer ahora?</h2>
              <ul>
                <li>Revisa el motivo del rechazo arriba indicado</li>
                <li>Prepara un nuevo documento que cumpla con los requisitos</li>
                <li>Sube el documento actualizado desde tu portal</li>
              </ul>
              ` : ''}

              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.documentsUrl}" class="button">Ver Mis Documentos</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Trefa Autos</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Trefa. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return '';
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
        name: 'Trefa Autos',
        email: 'noreply@trefaautos.com'
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    const { to, toName, subject, templateType, templateData } = emailRequest;

    // Generate the HTML email template
    const htmlContent = getEmailTemplate(templateType, templateData);

    // Send via Brevo
    const result = await sendBrevoEmail(to, toName, subject, htmlContent);

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500
      }
    );
  }
});
