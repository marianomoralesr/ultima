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
  templateType: 'application_submitted' | 'status_changed' | 'document_status_changed' | 'document_uploaded' | 'admin_notification' | 'valuation_notification' | 'verification_code' | 'survey_invitation';
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
              <img src="${logoUrl}" alt="TREFA" class="logo" />
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
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'status_changed':
      const statusMessages: Record<string, { title: string; message: string; nextSteps: string[] }> = {
        'Completa': {
          title: 'Solicitud Completa Recibida',
          message: 'Hemos recibido tu solicitud completa con todos los documentos requeridos.',
          nextSteps: [
            'Estamos verificando tus documentos y datos proporcionados',
            'Evaluando tu perfil crediticio',
            'Te contactaremos con una actualización pronto'
          ]
        },
        'Faltan Documentos': {
          title: 'Documentos Pendientes',
          message: 'Necesitamos que completes algunos documentos para continuar con tu solicitud.',
          nextSteps: [
            'Revisa la lista de documentos requeridos en tu portal',
            'Sube los documentos faltantes lo antes posible',
            'Una vez recibidos, continuaremos con el proceso'
          ]
        },
        'En Revisión': {
          title: 'Tu Solicitud está en Revisión',
          message: 'Nuestro equipo está analizando tu información detalladamente.',
          nextSteps: [
            'Estamos verificando tus documentos y datos proporcionados',
            'Evaluando tu perfil crediticio',
            'Te contactaremos si necesitamos información adicional'
          ]
        },
        'Aprobada': {
          title: '¡Felicidades! Tu Solicitud fue Aprobada',
          message: 'Tu solicitud de financiamiento ha sido aprobada exitosamente.',
          nextSteps: [
            'Un asesor se pondrá en contacto contigo para finalizar detalles',
            'Revisa las condiciones de financiamiento en tu portal',
            'Prepara tu documentación para la firma del contrato'
          ]
        },
        'Rechazada': {
          title: 'Actualización de tu Solicitud',
          message: 'Lamentablemente, no pudimos aprobar tu solicitud en este momento.',
          nextSteps: [
            'Puedes solicitar una revisión o más información sobre el motivo',
            'Te invitamos a mejorar tu perfil crediticio',
            'Podrás aplicar nuevamente en el futuro'
          ]
        },
        // Legacy status mappings for backwards compatibility
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
              <img src="${logoUrl}" alt="TREFA" class="logo" />
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
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
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
              <img src="${logoUrl}" alt="TREFA" class="logo" />
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
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'document_uploaded':
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="TREFA" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">✅ Documento Recibido con Éxito</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, hemos recibido tu documento correctamente a través del dropzone público.</p>

              <div class="card">
                <div class="card-title">Detalles del Documento</div>
                <div class="card-content">
                  <p><strong>Tipo de Documento:</strong> ${data.documentType}</p>
                  <p><strong>Nombre del Archivo:</strong> ${data.documentName}</p>
                  ${data.vehicleTitle ? `<p><strong>Vehículo:</strong> ${data.vehicleTitle}</p>` : ''}
                  <p><strong>ID de Solicitud:</strong> ${data.applicationId}</p>
                  <p><strong>Fecha de Subida:</strong> ${new Date(data.uploadedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p><strong>Estado:</strong> <span class="status-badge status-reviewing">En Revisión</span></p>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">¿Qué sigue?</h2>
              <ul>
                <li><strong>Verificación:</strong> Nuestro equipo revisará el documento subido</li>
                <li><strong>Validación:</strong> Verificaremos que cumpla con los requisitos</li>
                <li><strong>Notificación:</strong> Te avisaremos del resultado de la revisión</li>
              </ul>

              <div style="background: #F0F9FF; border-left: 4px solid #0369A1; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; color: #0C4A6E; font-size: 14px; line-height: 1.6;">
                  <strong>💡 Tip:</strong> Puedes seguir subiendo los demás documentos requeridos desde el mismo enlace que recibiste. Cada documento que subas te acerca más a completar tu solicitud.
                </p>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.statusUrl}" class="button">Ver Estado de mi Solicitud</a>
              </div>

              <p style="font-size: 14px; color: #556675; text-align: center; margin-top: 32px;">
                Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Financiamiento de vehículos confiable y transparente</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'admin_notification':
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="TREFA" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">🔔 Nueva Solicitud Recibida</h1>
              <p class="subtitle">Se ha recibido una nueva solicitud de financiamiento que requiere tu atención.</p>

              <div class="card">
                <div class="card-title">Información del Cliente</div>
                <div class="card-content">
                  <p><strong>Nombre:</strong> ${data.clientName}</p>
                  <p><strong>Email:</strong> ${data.clientEmail}</p>
                  <p><strong>Teléfono:</strong> ${data.clientPhone}</p>
                  ${data.vehicleTitle ? `<p><strong>Vehículo de Interés:</strong> ${data.vehicleTitle}</p>` : ''}
                  ${data.asesorName ? `<p><strong>Asesor Asignado:</strong> ${data.asesorName}</p>` : ''}
                  <p><strong>Fecha de Solicitud:</strong> ${new Date(data.submittedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">Próximas Acciones</h2>
              <ul>
                <li><strong>Revisar Documentación:</strong> Verifica que toda la información esté completa</li>
                <li><strong>Contactar al Cliente:</strong> Ponte en contacto dentro de las próximas 24 horas</li>
                <li><strong>Evaluar Solicitud:</strong> Analiza el perfil crediticio y capacidad de pago</li>
                <li><strong>Asignar Asesor:</strong> Si no está asignado, designa un asesor de ventas</li>
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${data.adminProfileUrl}" class="button">Ver Perfil del Cliente</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA - Panel Administrativo</p>
              <p class="footer-text">Gestión de solicitudes y clientes</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'valuation_notification':
      const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
      return `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8">${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Autos TREFA" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">🚗 Nueva Cotización de Vehículo Recibida</h1>
              <p class="subtitle">Se ha recibido una nueva solicitud de cotización a través del formulario de valuación en línea.</p>

              <div class="card">
                <div class="card-title">Información del Lead</div>
                <div class="card-content">
                  <p><strong>Nombre:</strong> ${data.clientName}</p>
                  <p><strong>Email:</strong> ${data.clientEmail}</p>
                  <p><strong>Teléfono:</strong> ${data.clientPhone}</p>
                  <p><strong>Fecha de Cotización:</strong> ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div class="card">
                <div class="card-title">Vehículo a Vender</div>
                <div class="card-content">
                  <p><strong>Vehículo:</strong> ${data.vehicleLabel}</p>
                  <p><strong>Kilometraje:</strong> ${data.mileage.toLocaleString('es-MX')} km</p>
                </div>
              </div>

              <div class="card">
                <div class="card-title">Oferta Generada</div>
                <div class="card-content">
                  <p><strong>Oferta Sugerida:</strong> <span class="highlight" style="font-size: 20px;">${currencyFormatter.format(data.suggestedOffer)}</span></p>
                  <p><strong>Valor de Mercado Alto:</strong> ${currencyFormatter.format(data.highMarketValue)}</p>
                  <p><strong>Valor de Mercado Bajo:</strong> ${currencyFormatter.format(data.lowMarketValue)}</p>
                </div>
              </div>

              <div class="divider"></div>

              <p style="font-size: 14px; color: #556675; background: #FEF3C7; padding: 12px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                <strong>📋 Recordatorio:</strong> Todas las valuaciones se encuentran en la tabla <strong>"Valuaciones"</strong> de Airtable.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="https://airtable.com" class="button">Ver en Airtable</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA - Panel Administrativo</p>
              <p class="footer-text">Sistema de Gestión de Valuaciones</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'verification_code':
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          ${baseStyles}
          <style>
            .code-box {
              background: linear-gradient(135deg, #FF6801 0%, #F56100 100%);
              border-radius: 16px;
              padding: 40px 20px;
              text-align: center;
              margin: 32px 0;
              box-shadow: 0 8px 16px rgba(255, 104, 1, 0.2);
            }
            .code {
              font-size: 48px;
              font-weight: 700;
              color: #FFFFFF;
              letter-spacing: 12px;
              font-family: 'Courier New', monospace;
              margin: 16px 0;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .code-label {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .expiry-notice {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 16px;
              border-radius: 8px;
              margin: 24px 0;
            }
            .security-tips {
              background: #F0F9FF;
              border-left: 4px solid #0369A1;
              padding: 16px;
              border-radius: 8px;
              margin: 24px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="TREFA" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">🔐 Código de Verificación</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, aquí está tu código de verificación para acceder a tu valuación.</p>

              <div class="code-box">
                <p class="code-label">Tu código de verificación</p>
                <div class="code">${data.verificationCode}</div>
              </div>

              <div class="expiry-notice">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  <strong>⏱️ Importante:</strong> Este código expira en <strong>${data.expiresIn}</strong>
                </p>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">¿Cómo usar este código?</h2>
              <ul>
                <li>Regresa a la página de valuación donde solicitaste tu oferta</li>
                <li>Ingresa el código de 6 dígitos exactamente como aparece arriba</li>
                <li>Haz clic en "Verificar y Ver Oferta" para ver tu valuación</li>
              </ul>

              <div class="security-tips">
                <p style="margin: 0 0 8px 0; color: #0C4A6E; font-weight: 600;">
                  🛡️ Consejos de Seguridad
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #0C4A6E;">
                  <li style="margin: 6px 0;">No compartas este código con nadie</li>
                  <li style="margin: 6px 0;">TREFA nunca te pedirá este código por teléfono o WhatsApp</li>
                  <li style="margin: 6px 0;">Si no solicitaste este código, ignora este mensaje</li>
                </ul>
              </div>

              <p style="font-size: 14px; color: #556675; text-align: center; margin-top: 32px;">
                ¿No solicitaste este código? Puedes ignorar este correo de forma segura.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Sistema de Valuación de Vehículos</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'survey_invitation':
      // Generate unique QR code validation token
      const qrCodeData = `trefa-survey-${data.userId}-${Date.now()}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
      const surveyUrl = data.surveyUrl || 'https://trefa.mx/encuesta-anonima';

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          ${baseStyles}
          <style>
            .voucher-card {
              background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
              border-radius: 16px;
              padding: 32px;
              text-align: center;
              margin: 32px 0;
              box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
            }
            .voucher-title {
              font-size: 24px;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0 0 8px 0;
            }
            .voucher-subtitle {
              font-size: 16px;
              color: rgba(255, 255, 255, 0.9);
              margin: 0 0 24px 0;
            }
            .qr-container {
              background: #FFFFFF;
              padding: 20px;
              border-radius: 12px;
              display: inline-block;
              margin: 24px 0;
            }
            .benefits-list {
              background: #F7F8FA;
              border-radius: 12px;
              padding: 24px;
              margin: 32px 0;
              text-align: left;
            }
            .benefit-item {
              display: flex;
              align-items: start;
              margin: 16px 0;
              padding: 12px;
              background: #FFFFFF;
              border-radius: 8px;
              border-left: 4px solid #3B82F6;
            }
            .benefit-icon {
              font-size: 24px;
              margin-right: 16px;
              flex-shrink: 0;
            }
            .benefit-text {
              color: #0B2540;
              font-size: 16px;
              line-height: 1.6;
            }
            .cta-button {
              background: linear-gradient(135deg, #FF6801 0%, #F56100 100%);
              color: #FFFFFF;
              text-decoration: none;
              padding: 18px 40px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 18px;
              display: inline-block;
              margin: 24px 0;
              box-shadow: 0 6px 16px rgba(255, 104, 1, 0.3);
              transition: all 0.3s ease;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="TREFA" class="logo" />
            </div>
            <div class="content">
              <h1 class="title">🎁 ¡Tu Cupón de Beneficios te Espera!</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, al enviar tu solicitud de financiamiento, aceptaste participar en nuestra encuesta anónima. ¡Gracias por ayudarnos a mejorar!</p>

              <div class="voucher-card">
                <div class="voucher-title">✨ Cupón Especial de TREFA ✨</div>
                <p class="voucher-subtitle">Responde nuestra encuesta anónima y desbloquea beneficios exclusivos</p>

                <div class="qr-container">
                  <img src="${qrCodeUrl}" alt="Código QR de validación" style="display: block; margin: 0 auto;" />
                  <p style="margin: 12px 0 0 0; font-size: 12px; color: #556675; font-weight: 600;">
                    Código de Validación
                  </p>
                </div>

                <p style="color: rgba(255, 255, 255, 0.85); font-size: 14px; margin: 8px 0 0 0;">
                  Este QR valida tu participación en la encuesta
                </p>
              </div>

              <div class="benefits-list">
                <h3 style="font-size: 20px; color: #0B2540; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                  🌟 Elige Uno de Estos Increíbles Beneficios
                </h3>

                <div class="benefit-item">
                  <span class="benefit-icon">🚗</span>
                  <div>
                    <div class="benefit-text">
                      <strong>1 año de lavado de auto GRATIS</strong>
                    </div>
                  </div>
                </div>

                <div style="text-align: center; margin: 16px 0; color: #556675; font-weight: 600;">O</div>

                <div class="benefit-item">
                  <span class="benefit-icon">📋</span>
                  <div>
                    <div class="benefit-text">
                      <strong>Costo de placas GRATIS</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; text-align: center;">
                ¿Cómo Obtener tu Cupón?
              </h2>
              <ul style="max-width: 500px; margin: 24px auto;">
                <li>Haz clic en el botón de abajo para acceder a la encuesta anónima</li>
                <li>Responde preguntas breves sobre tu experiencia con TREFA</li>
                <li>Al terminar, recibirás tu cupón digital de inmediato</li>
                <li>Presenta tu código QR al canjear el beneficio</li>
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${surveyUrl}" class="cta-button">
                  📝 Responder Encuesta Ahora
                </a>
              </div>

              <div style="background: #F0F9FF; border-left: 4px solid #0369A1; padding: 16px; border-radius: 8px; margin: 32px 0;">
                <p style="margin: 0; color: #0C4A6E; font-size: 14px; line-height: 1.6;">
                  <strong>🔒 Privacidad Garantizada:</strong> Esta encuesta es completamente anónima. Tus respuestas nos ayudan a mejorar nuestros servicios para ti y futuros clientes.
                </p>
              </div>

              <p style="font-size: 14px; color: #556675; text-align: center; margin-top: 32px;">
                ¿Tienes preguntas? Responde a este correo y te ayudaremos con gusto.
              </p>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Tu opinión nos ayuda a ser mejores</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} TREFA. Todos los derechos reservados.</p>
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
        name: 'TREFA',
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
