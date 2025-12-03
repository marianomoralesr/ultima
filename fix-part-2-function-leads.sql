-- PARTE 2: Actualizar función get_sales_assigned_leads
DROP FUNCTION IF EXISTS get_sales_assigned_leads(uuid);
CREATE OR REPLACE FUNCTION get_sales_assigned_leads(sales_user_id uuid)
RETURNS TABLE(
    id uuid, email text, first_name text, last_name text, mother_last_name text,
    phone text, source text, contactado boolean, asesor_asignado_id uuid,
    asesor_asignado text, asesor_autorizado_acceso boolean, created_at timestamptz,
    metadata jsonb, latest_app_status text, latest_app_id uuid,
    latest_app_submitted boolean, latest_app_car_info jsonb,
    documents jsonb, bank_profile_data jsonb, rfc text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.first_name, p.last_name, p.mother_last_name,
        p.phone, p.source, p.contactado, p.asesor_asignado_id,
        COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
        COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
        p.created_at, p.metadata,
        latest_app.status as latest_app_status, latest_app.id as latest_app_id,
        latest_app.submitted as latest_app_submitted, latest_app.car_info as latest_app_car_info,
        COALESCE((SELECT jsonb_agg(to_jsonb(d.*)) FROM uploaded_documents d WHERE d.user_id = p.id), '[]'::jsonb) as documents,
        to_jsonb(bp.*) as bank_profile_data, p.rfc
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    LEFT JOIN LATERAL (
        SELECT id, status, submitted, car_info FROM financing_applications
        WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1
    ) latest_app ON true
    LEFT JOIN bank_profiles bp ON bp.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id AND p.role = 'user'
    ORDER BY p.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(uuid) TO authenticated;
