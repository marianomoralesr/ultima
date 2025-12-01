import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      return new Response(
        JSON.stringify({
          error: 'Configuración del servidor incorrecta',
          details: 'Missing environment variables'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    // GET request - Verificar token y obtener información de la aplicación
    if (req.method === 'GET') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar que el token exista y obtener información de la aplicación
      const { data: application, error: appError } = await supabaseClient
        .from('financing_applications')
        .select('id, user_id, status, created_at, car_info, token_expires_at')
        .eq('public_upload_token', token)
        .single();

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar si el token ha expirado
      if (application.token_expires_at) {
        const expiresAt = new Date(application.token_expires_at);
        const now = new Date();

        if (now > expiresAt) {
          return new Response(
            JSON.stringify({
              error: 'Token expirado',
              message: 'Este enlace ha expirado. Por favor, contacta a tu asesor para obtener un nuevo enlace.',
              expired: true,
              expired_at: application.token_expires_at
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Obtener documentos ya subidos
      const { data: documents, error: docsError } = await supabaseClient
        .from('uploaded_documents')
        .select('id, document_type, file_name, created_at, status')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({
          application: {
            id: application.id,
            status: application.status,
            created_at: application.created_at,
            vehicle: application.car_info?._vehicleTitle || 'Vehículo'
          },
          documents: documents || []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST request - Subir documento
    if (req.method === 'POST') {
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar token y obtener aplicación
      const { data: application, error: appError } = await supabaseClient
        .from('financing_applications')
        .select('id, user_id, token_expires_at')
        .eq('public_upload_token', token)
        .single();

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar si el token ha expirado
      if (application.token_expires_at) {
        const expiresAt = new Date(application.token_expires_at);
        const now = new Date();

        if (now > expiresAt) {
          return new Response(
            JSON.stringify({
              error: 'Token expirado',
              message: 'Este enlace ha expirado. Por favor, contacta a tu asesor para obtener un nuevo enlace.',
              expired: true
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Parsear el form data
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const documentType = formData.get('document_type') as string;

      if (!file || !documentType) {
        return new Response(
          JSON.stringify({ error: 'Archivo y tipo de documento requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: 'Tipo de archivo no permitido. Solo PDF, JPG y PNG' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({ error: 'Archivo muy grande. Máximo 10MB' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${application.user_id}/${application.id}/${documentType}_${timestamp}.${fileExt}`;

      // Subir archivo a Supabase Storage
      const fileBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('application-documents')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Error al subir archivo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Registrar documento en la base de datos
      const { data: documentRecord, error: dbError } = await supabaseClient
        .from('uploaded_documents')
        .insert({
          user_id: application.user_id,
          application_id: application.id,
          document_type: documentType,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          content_type: file.type,
          status: 'reviewing'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error registrando documento:', dbError);
        // Intentar eliminar el archivo subido
        await supabaseClient.storage.from('application-documents').remove([fileName]);
        return new Response(
          JSON.stringify({ error: 'Error al registrar documento' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar si todos los documentos requeridos están completos
      // Only require 4 documents: INE front, INE back, proof of address, proof of income
      const REQUIRED_DOCS = ['ine_front', 'ine_back', 'proof_address', 'proof_income'];

      const { data: allDocs } = await supabaseClient
        .from('uploaded_documents')
        .select('document_type')
        .eq('application_id', application.id);

      const uploadedDocTypes = new Set(allDocs?.map(doc => doc.document_type) || []);
      const allDocsComplete = REQUIRED_DOCS.every(docType => uploadedDocTypes.has(docType));

      // Si todos los documentos están completos, actualizar status a "Completa"
      if (allDocsComplete) {
        const { error: statusError } = await supabaseClient
          .from('financing_applications')
          .update({
            status: 'Completa',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id);

        if (statusError) {
          console.error('Error actualizando status de aplicación:', statusError);
        } else {
          console.log('Aplicación marcada como Completa - todos los documentos requeridos subidos');

          // Obtener banco recomendado del perfil bancario
          const { data: bankProfile } = await supabaseClient
            .from('bank_profiles')
            .select('banco_recomendado, banco_segunda_opcion')
            .eq('user_id', application.user_id)
            .single();

          if (bankProfile?.banco_recomendado) {
            console.log(`Aplicación lista para banco recomendado: ${bankProfile.banco_recomendado}`);
            // La visibilidad se maneja automáticamente por RLS policies basadas en status='submitted'
            // y el banco_recomendado del perfil bancario del usuario
          }
        }
      }

      // Enviar notificación por email (no bloqueante)
      try {
        // Obtener información del usuario y aplicación
        const { data: userProfile } = await supabaseClient
          .from('profiles')
          .select('email, first_name, last_name')
          .eq('id', application.user_id)
          .single();

        if (userProfile?.email) {
          // Obtener información completa de la aplicación
          const { data: fullApplication } = await supabaseClient
            .from('financing_applications')
            .select('car_info, application_data')
            .eq('id', application.id)
            .single();

          const documentTypeLabels: Record<string, string> = {
            'ine_front': 'INE (Frente)',
            'ine_back': 'INE (Reverso)',
            'proof_address': 'Comprobante de Domicilio',
            'proof_income': 'Comprobante de Ingresos',
            'constancia_fiscal': 'Constancia de Situación Fiscal',
          };

          // Enviar email al usuario
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-brevo-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              to: userProfile.email,
              toName: `${userProfile.first_name} ${userProfile.last_name}`,
              subject: `Documento Recibido - ${documentTypeLabels[documentType] || documentType}`,
              templateType: 'document_uploaded',
              templateData: {
                clientName: `${userProfile.first_name} ${userProfile.last_name}`,
                documentName: file.name,
                documentType: documentTypeLabels[documentType] || documentType,
                vehicleTitle: fullApplication?.car_info?._vehicleTitle || 'Tu vehículo',
                applicationId: application.id.slice(0, 8),
                uploadedAt: new Date().toISOString(),
                statusUrl: `${Deno.env.get('SUPABASE_URL').replace('//', '//trefa.mx')}/escritorio/mis-aplicaciones`,
              },
            }),
          });

          console.log('Notificación de documento enviada exitosamente');
        }
      } catch (emailError) {
        // Log error pero no fallar la request
        console.error('Error enviando notificación de documento:', emailError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          document: {
            id: documentRecord.id,
            document_type: documentRecord.document_type,
            file_name: documentRecord.file_name,
            status: documentRecord.status,
            created_at: documentRecord.created_at
          },
          all_documents_complete: allDocsComplete,
          application_status_updated: allDocsComplete ? 'Completa' : null,
          application_id: application.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
