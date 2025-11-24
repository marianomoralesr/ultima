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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
        .select('id, user_id, status, created_at, car_info')
        .eq('public_upload_token', token)
        .single();

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        .select('id, user_id')
        .eq('public_upload_token', token)
        .single();

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        .from('financing-documents')
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
        await supabaseClient.storage.from('financing-documents').remove([fileName]);
        return new Response(
          JSON.stringify({ error: 'Error al registrar documento' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
          }
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
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
