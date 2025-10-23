-- Fix: Update get_crm_dashboard_stats to return the correct fields expected by the dashboard
-- The dashboard expects: total_leads, leads_with_active_app, leads_with_unfinished_app, leads_needing_follow_up

DROP FUNCTION IF EXISTS public.get_crm_dashboard_stats();

CREATE OR REPLACE FUNCTION public.get_crm_dashboard_stats()
RETURNS TABLE(
    total_leads bigint,
    leads_with_active_app bigint,
    leads_with_unfinished_app bigint,
    leads_needing_follow_up bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if the current user has admin or sales role
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin or sales role required.';
    END IF;

    RETURN QUERY
    SELECT
        -- Total leads (users with role='user')
        (SELECT COUNT(*)::bigint FROM profiles WHERE role = 'user') AS total_leads,

        -- Leads with active applications (submitted, reviewing, or pending docs)
        (SELECT COUNT(DISTINCT fa.user_id)::bigint
         FROM financing_applications fa
         INNER JOIN profiles p ON p.id = fa.user_id
         WHERE p.role = 'user'
         AND fa.status IN ('submitted', 'reviewing', 'pending_docs')
        ) AS leads_with_active_app,

        -- Leads with unfinished applications (draft status)
        (SELECT COUNT(DISTINCT fa.user_id)::bigint
         FROM financing_applications fa
         INNER JOIN profiles p ON p.id = fa.user_id
         WHERE p.role = 'user'
         AND fa.status = 'draft'
        ) AS leads_with_unfinished_app,

        -- Leads needing follow up (not contacted yet)
        (SELECT COUNT(*)::bigint
         FROM profiles
         WHERE role = 'user'
         AND (contactado = false OR contactado IS NULL)
        ) AS leads_needing_follow_up;
END;
$$;

ALTER FUNCTION public.get_crm_dashboard_stats() OWNER TO postgres;

COMMENT ON FUNCTION public.get_crm_dashboard_stats() IS 'Returns CRM dashboard statistics. Only counts users with role=user. Requires admin or sales role to call.';
