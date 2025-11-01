import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_EMAILS = [
  'marianomorales@outlook.com',
  'mariano.morales@autostrefa.mx',
  'alejandro.trevino@autostrefa.mx',
  'evelia.castillo@autostrefa.mx',
  'fernando.trevino@autostrefa.mx'
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      .button { display: inline-block; background: linear-gradient(135deg, #FF6801 0%, #F56100 100%); color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; box-shadow: 0 4px 6px rgba(255, 104, 1, 0.2); }
      .button:hover { box-shadow: 0 6px 12px rgba(255, 104, 1, 0.3); }
      .footer { background-color: #0B2540; color: #FFFFFF; padding: 32px 30px; text-align: center; }
      .footer-text { font-size: 14px; color: #CBD5E1; margin: 8px 0; }
      .divider { height: 1px; background: linear-gradient(to right, transparent, #E5E7EB, transparent); margin: 32px 0; }
      .highlight { color: #FF6801; font-weight: 600; }
      .vehicle-card { background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .vehicle-img { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; }
      .vehicle-title { font-size: 16px; font-weight: 600; color: #0B2540; margin-bottom: 8px; }
      .vehicle-price { font-size: 20px; font-weight: 700; color: #FF6801; }
      .unsubscribe { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 20px; }
      .unsubscribe a { color: #94A3B8; text-decoration: underline; }
      ul { padding-left: 20px; }
      li { margin: 12px 0; color: #374151; line-height: 1.6; }
    </style>
  `;

  const logoUrl = `${SUPABASE_URL}/storage/v1/object/public/public-assets/logoblanco.png`;
  const unsubscribeLink = `${SUPABASE_URL.replace('.supabase.co', '')}/escritorio/perfil?unsubscribe=true`;

  switch (type) {
    case 'incomplete_application':
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
              <h1 class="title">¿Necesitas ayuda para completar tu solicitud?</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, notamos que comenzaste una solicitud de financiamiento pero aún no la has completado.</p>

              <div class="card">
                <div class="card-title">Estado de tu Solicitud</div>
                <div class="card-content">
                  ${data.vehicleTitle ? `<p><strong>Vehículo de Interés:</strong> ${data.vehicleTitle}</p>` : ''}
                  <p><strong>Iniciaste:</strong> ${new Date(data.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><strong>Estado:</strong> Borrador (Incompleta)</p>
                </div>
              </div>

              <div class="divider"></div>

              <p style="font-size: 16px; color: #0B2540; text-align: center; margin: 24px 0;">
                <strong>¿Tienes dudas? Estamos aquí para ayudarte.</strong><br>
                Nuestro equipo puede guiarte paso a paso en el proceso de financiamiento.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.applicationUrl}" class="button">Completar mi Solicitud</a>
              </div>

              <p style="font-size: 14px; color: #556675; background: #E0F2FE; padding: 16px; border-radius: 8px; border-left: 4px solid #0369A1;">
                💡 <strong>¿Necesitas ayuda personalizada?</strong><br>
                Contáctanos y uno de nuestros asesores te apoyará en completar tu solicitud.
              </p>

              ${data.vehicles && data.vehicles.length > 0 ? `
              <div class="divider"></div>
              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; text-align: center;">Vehículos Disponibles para Financiar</h2>
              ${data.vehicles.map((v: any) => `
                <div class="vehicle-card">
                  ${v.image ? `<img src="${v.image}" alt="${v.title}" class="vehicle-img" />` : ''}
                  <div class="vehicle-title">${v.title}</div>
                  <div class="vehicle-price">Desde ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v.price)} MXN</div>
                  <p style="font-size: 13px; color: #64748B; margin-top: 8px;">Con hasta 60 meses de financiamiento</p>
                </div>
              `).join('')}
              ` : ''}
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Agencia Automotriz de Servicio Personalizado</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              <div class="unsubscribe">
                <a href="${unsubscribeLink}">Cancelar suscripción</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'incomplete_profile':
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
              <h1 class="title">Completa tu perfil y accede a financiamiento</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, te damos la bienvenida a Autos TREFA. Para poder brindarte el mejor servicio, necesitamos que completes tu perfil.</p>

              <div class="card">
                <div class="card-title">¿Por qué completar mi perfil?</div>
                <div class="card-content">
                  <p>✓ Acceso a solicitudes de financiamiento</p>
                  <p>✓ Ofertas personalizadas de vehículos</p>
                  <p>✓ Proceso de aprobación más rápido</p>
                  <p>✓ Atención personalizada de nuestros asesores</p>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600;">Pasos para Solicitar Financiamiento</h2>
              <ul>
                <li><strong>Completa tu Perfil:</strong> Proporciona tu información personal y de contacto</li>
                <li><strong>Elige tu Vehículo:</strong> Explora nuestro inventario y selecciona el auto ideal</li>
                <li><strong>Inicia tu Solicitud:</strong> Llena el formulario de financiamiento</li>
                <li><strong>Documentación:</strong> Sube los documentos requeridos</li>
                <li><strong>Aprobación:</strong> Recibe una respuesta en 24-48 horas</li>
              </ul>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.profileUrl}" class="button">Completar mi Perfil</a>
              </div>

              ${data.vehicles && data.vehicles.length > 0 ? `
              <div class="divider"></div>
              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; text-align: center;">Compra este Auto a crédito con hasta 60 meses</h2>
              ${data.vehicles.map((v: any) => `
                <div class="vehicle-card">
                  ${v.image ? `<img src="${v.image}" alt="${v.title}" class="vehicle-img" />` : ''}
                  <div class="vehicle-title">${v.title}</div>
                  <div class="vehicle-price">Desde ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v.price)} MXN</div>
                  <p style="font-size: 13px; color: #64748B; margin-top: 8px;">Con hasta 60 meses de financiamiento</p>
                </div>
              `).join('')}
              ` : ''}
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Agencia Automotriz de Servicio Personalizado</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              <div class="unsubscribe">
                <a href="${unsubscribeLink}">Cancelar suscripción</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'purchase_lead_followup':
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
              <h1 class="title">¡Queremos Comprar tu ${data.vehicleInfo}!</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, recibimos tu solicitud para vender tu vehículo y estamos muy interesados.</p>

              <div class="card">
                <div class="card-title">Detalles de tu Vehículo</div>
                <div class="card-content">
                  <p><strong>Vehículo:</strong> ${data.vehicleInfo}</p>
                  ${data.suggestedOffer ? `<p><strong>Oferta Inicial:</strong> ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.suggestedOffer)}</p>` : ''}
                  <p><strong>Solicitud Enviada:</strong> ${new Date(data.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div class="divider"></div>

              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; text-align: center;">Próximos Pasos para Vender tu Auto</h2>
              <ul>
                <li><strong>Inspección Gratuita:</strong> Agenda una cita para inspeccionar tu vehículo</li>
                <li><strong>Oferta Personalizada:</strong> Te daremos una oferta competitiva basada en el estado real</li>
                <li><strong>Pago Inmediato:</strong> Si aceptas, te pagamos al instante</li>
                <li><strong>Sin Complicaciones:</strong> Nos encargamos de todos los trámites</li>
              </ul>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${SUPABASE_URL.replace('.supabase.co', '')}/escritorio/admin/compras/${data.leadId}" class="button">Contactar a mi Asesor</a>
              </div>

              <p style="font-size: 14px; color: #556675; background: #FEF3C7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                💡 <strong>¿Tienes preguntas?</strong><br>
                Contáctanos al WhatsApp o responde este correo. Estamos listos para ayudarte.
              </p>

              ${data.vehicles && data.vehicles.length > 0 ? `
              <div class="divider"></div>
              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; text-align: center;">O Intercambia tu Auto por uno de Estos</h2>
              ${data.vehicles.map((v: any) => `
                <div class="vehicle-card">
                  ${v.image ? `<img src="${v.image}" alt="${v.title}" class="vehicle-img" />` : ''}
                  <div class="vehicle-title">${v.title}</div>
                  <div class="vehicle-price">Desde ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v.price)} MXN</div>
                  <p style="font-size: 13px; color: #64748B; margin-top: 8px;">Con hasta 60 meses de financiamiento</p>
                </div>
              `).join('')}
              ` : ''}
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Agencia Automotriz de Servicio Personalizado</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              <div class="unsubscribe">
                <a href="${unsubscribeLink}">Cancelar suscripción</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'valuation_followup':
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
              <h1 class="title">¿Listo para Vender tu ${data.vehicleInfo}?</h1>
              <p class="subtitle">Hola <span class="highlight">${data.clientName}</span>, hace poco valuaste tu vehículo con nosotros.</p>

              <div class="card">
                <div class="card-title">Resumen de tu Valuación</div>
                <div class="card-content">
                  <p><strong>Vehículo:</strong> ${data.vehicleInfo}</p>
                  ${data.suggestedOffer ? `<p><strong>Valuación Estimada:</strong> ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.suggestedOffer)}</p>` : ''}
                  ${data.mileage ? `<p><strong>Kilometraje:</strong> ${new Intl.NumberFormat('es-MX').format(data.mileage)} km</p>` : ''}
                  <p><strong>Valuación Realizada:</strong> ${new Date(data.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div class="divider"></div>

              <p style="font-size: 16px; color: #0B2540; text-align: center; margin: 24px 0;">
                <strong>¿Por qué vender con Autos TREFA?</strong>
              </p>

              <ul>
                <li><strong>Proceso Rápido y Fácil:</strong> Sin complicaciones ni trámites largos</li>
                <li><strong>Pago Inmediato:</strong> Te pagamos el mismo día</li>
                <li><strong>Mejor Precio:</strong> Oferta justa basada en el mercado</li>
                <li><strong>Nos Encargamos de Todo:</strong> Trámites, papeles y más</li>
              </ul>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${SUPABASE_URL.replace('.supabase.co', '')}/vende-tu-auto" class="button">Continuar con la Venta</a>
              </div>

              <p style="font-size: 14px; color: #556675; background: #DBEAFE; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6;">
                💡 <strong>Tu valuación sigue vigente</strong><br>
                Puedes continuar con el proceso de venta en cualquier momento.
              </p>

              ${data.vehicles && data.vehicles.length > 0 ? `
              <div class="divider"></div>
              <h2 style="font-size: 20px; color: #0B2540; font-weight: 600; text-align: center;">¿Buscas Cambiar de Auto?</h2>
              <p style="text-align: center; color: #64748B; margin-bottom: 16px;">Aprovecha tu auto como anticipo</p>
              ${data.vehicles.map((v: any) => `
                <div class="vehicle-card">
                  ${v.image ? `<img src="${v.image}" alt="${v.title}" class="vehicle-img" />` : ''}
                  <div class="vehicle-title">${v.title}</div>
                  <div class="vehicle-price">Desde ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v.price)} MXN</div>
                  <p style="font-size: 13px; color: #64748B; margin-top: 8px;">Con hasta 60 meses de financiamiento</p>
                </div>
              `).join('')}
              ` : ''}
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Agencia Automotriz de Servicio Personalizado</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
              <div class="unsubscribe">
                <a href="${unsubscribeLink}">Cancelar suscripción</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'sales_agent_digest':
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
              <h1 class="title">📊 Resumen Diario de Leads</h1>
              <p class="subtitle">Reporte de leads que requieren tu atención</p>

              ${data.pendingLeads && data.pendingLeads.length > 0 ? `
              <div class="card">
                <div class="card-title">Leads con Resolución Pendiente (${data.pendingLeads.length})</div>
                <div class="card-content">
                  ${data.pendingLeads.map((lead: any) => `
                    <div style="border-bottom: 1px solid #E5E7EB; padding: 12px 0;">
                      <p style="margin: 4px 0;"><strong>${lead.name}</strong></p>
                      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">${lead.email}</p>
                      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">Tel: ${lead.phone || 'No proporcionado'}</p>
                      ${lead.vehicleTitle ? `<p style="margin: 4px 0; font-size: 14px; color: #64748B;">Interés: ${lead.vehicleTitle}</p>` : ''}
                      <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;">Última actividad: ${new Date(lead.lastActivity).toLocaleDateString('es-MX')}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              ${data.incompleteApplications && data.incompleteApplications.length > 0 ? `
              <div class="card">
                <div class="card-title">Solicitudes Iniciadas sin Completar (${data.incompleteApplications.length})</div>
                <div class="card-content">
                  ${data.incompleteApplications.map((app: any) => `
                    <div style="border-bottom: 1px solid #E5E7EB; padding: 12px 0;">
                      <p style="margin: 4px 0;"><strong>${app.name}</strong></p>
                      <p style="margin: 4px 0; font-size: 14px; color: #64748B;">${app.email}</p>
                      ${app.vehicleTitle ? `<p style="margin: 4px 0; font-size: 14px; color: #64748B;">Vehículo: ${app.vehicleTitle}</p>` : ''}
                      <p style="margin: 4px 0; font-size: 13px; color: #94A3B8;">Iniciada: ${new Date(app.createdAt).toLocaleDateString('es-MX')}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.crmUrl}" class="button">Ver CRM Completo</a>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text" style="font-weight: 600; font-size: 16px; color: #FFFFFF;">Autos TREFA</p>
              <p class="footer-text">Agencia Automotriz de Servicio Personalizado</p>
              <p class="footer-text" style="margin-top: 20px;">© ${new Date().getFullYear()} Autos TREFA. Todos los derechos reservados.</p>
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

const getFeaturedVehicles = async (limit: number = 3) => {
  const { data, error } = await supabase
    .from('inventario_cache')
    .select('id, titulo, precio, feature_image')
    .eq('ordenstatus', 'Disponible')
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }

  return data?.map(v => ({
    title: v.titulo,
    price: v.precio || 0,
    image: Array.isArray(v.feature_image) ? v.feature_image[0]?.url : typeof v.feature_image === 'string' ? v.feature_image : null
  })) || [];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const results = {
      incompleteApplications: 0,
      incompleteProfiles: 0,
      purchaseLeads: 0,
      valuationLeads: 0,
      salesAgentEmails: 0,
      errors: [] as string[]
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get featured vehicles for email templates
    const vehicles = await getFeaturedVehicles(3);

    // 1. Find users with incomplete applications (started > 24 hours ago)
    const { data: incompleteApps, error: appsError } = await supabase
      .from('financing_applications')
      .select(`
        id,
        user_id,
        car_info,
        created_at,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'draft')
      .lt('created_at', yesterday.toISOString());

    if (!appsError && incompleteApps) {
      for (const app of incompleteApps) {
        try {
          const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
          if (profile?.email) {
            const clientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente';
            const htmlContent = getEmailTemplate('incomplete_application', {
              clientName,
              vehicleTitle: app.car_info?._vehicleTitle || null,
              createdAt: app.created_at,
              applicationUrl: `${SUPABASE_URL.replace('.supabase.co', '')}/escritorio/solicitar-financiamiento`,
              vehicles
            });

            await sendBrevoEmail(
              profile.email,
              clientName,
              'Notificaciones | TREFA - Completa tu solicitud de financiamiento',
              htmlContent
            );

            // Log email to database
            await supabase.from('user_email_notifications').insert({
              user_id: profile.id,
              email_type: 'incomplete_application',
              subject: 'Notificaciones | TREFA - Completa tu solicitud de financiamiento',
              sent_at: new Date().toISOString(),
              status: 'sent'
            });

            results.incompleteApplications++;
          }
        } catch (err: any) {
          results.errors.push(`Error sending incomplete app email to ${app.profiles?.email}: ${err.message}`);
        }
      }
    }

    // 2. Find users with incomplete profiles (signed up > 24 hours ago, no name)
    const { data: incompleteProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, created_at')
      .eq('role', 'user')
      .lt('created_at', yesterday.toISOString())
      .or('first_name.is.null,last_name.is.null');

    if (!profilesError && incompleteProfiles) {
      for (const profile of incompleteProfiles) {
        try {
          if (profile.email) {
            const clientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente';
            const htmlContent = getEmailTemplate('incomplete_profile', {
              clientName,
              profileUrl: `${SUPABASE_URL.replace('.supabase.co', '')}/escritorio/perfil`,
              vehicles
            });

            await sendBrevoEmail(
              profile.email,
              clientName,
              'Notificaciones | TREFA - Completa tu perfil',
              htmlContent
            );

            // Log email to database
            await supabase.from('user_email_notifications').insert({
              user_id: profile.id,
              email_type: 'incomplete_profile',
              subject: 'Notificaciones | TREFA - Completa tu perfil',
              sent_at: new Date().toISOString(),
              status: 'sent'
            });

            results.incompleteProfiles++;
          }
        } catch (err: any) {
          results.errors.push(`Error sending incomplete profile email to ${profile.email}: ${err.message}`);
        }
      }
    }

    // 3. Find purchase leads (user_vehicles_for_sale) created > 24 hours ago and not contacted
    const { data: purchaseLeadsData, error: purchaseLeadsError } = await supabase
      .from('user_vehicles_for_sale')
      .select(`
        id,
        user_id,
        valuation_data,
        created_at,
        contacted,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('contacted', false)
      .lt('created_at', yesterday.toISOString());

    if (!purchaseLeadsError && purchaseLeadsData) {
      for (const lead of purchaseLeadsData) {
        try {
          const profile = Array.isArray(lead.profiles) ? lead.profiles[0] : lead.profiles;
          if (profile?.email) {
            const clientName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente';
            const vehicleInfo = lead.valuation_data?.vehicle?.label || 'tu vehículo';
            const suggestedOffer = lead.valuation_data?.valuation?.suggestedOffer || null;

            const htmlContent = getEmailTemplate('purchase_lead_followup', {
              clientName,
              vehicleInfo,
              suggestedOffer,
              createdAt: lead.created_at,
              leadId: lead.id,
              vehicles
            });

            await sendBrevoEmail(
              profile.email,
              clientName,
              `Notificaciones | TREFA - Queremos Comprar tu ${vehicleInfo}`,
              htmlContent
            );

            // Log email to database
            await supabase.from('user_email_notifications').insert({
              user_id: profile.id,
              email_type: 'purchase_lead_followup',
              subject: `Notificaciones | TREFA - Queremos Comprar tu ${vehicleInfo}`,
              sent_at: new Date().toISOString(),
              status: 'sent'
            });

            results.purchaseLeads++;
          }
        } catch (err: any) {
          results.errors.push(`Error sending purchase lead email to ${lead.profiles?.email}: ${err.message}`);
        }
      }
    }

    // 4. Send daily digest to sales agents
    const { data: pendingLeads, error: leadsError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        contactado,
        updated_at
      `)
      .eq('role', 'user')
      .eq('contactado', false);

    const { data: draftApps, error: draftError } = await supabase
      .from('financing_applications')
      .select(`
        id,
        user_id,
        car_info,
        created_at,
        profiles:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'draft')
      .lt('created_at', yesterday.toISOString());

    for (const adminEmail of ADMIN_EMAILS) {
      try {
        const pendingLeadsData = pendingLeads?.map(lead => ({
          name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin nombre',
          email: lead.email || 'N/A',
          phone: lead.phone,
          lastActivity: lead.updated_at,
          vehicleTitle: null
        })) || [];

        const incompleteAppsData = draftApps?.map(app => {
          const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
          return {
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Sin nombre',
            email: profile?.email || 'N/A',
            vehicleTitle: app.car_info?._vehicleTitle || null,
            createdAt: app.created_at
          };
        }) || [];

        const htmlContent = getEmailTemplate('sales_agent_digest', {
          pendingLeads: pendingLeadsData,
          incompleteApplications: incompleteAppsData,
          crmUrl: `${SUPABASE_URL.replace('.supabase.co', '')}/escritorio/admin/crm`
        });

        await sendBrevoEmail(
          adminEmail,
          'Equipo TREFA',
          'Notificaciones | TREFA - Resumen Diario de Leads',
          htmlContent
        );
        results.salesAgentEmails++;
      } catch (err: any) {
        results.errors.push(`Error sending digest to ${adminEmail}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Sent ${results.incompleteApplications} incomplete app emails, ${results.incompleteProfiles} incomplete profile emails, ${results.purchaseLeads} purchase lead emails, and ${results.salesAgentEmails} sales agent digests.`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in automated email notifications:', error);
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
