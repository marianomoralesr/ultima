-- Migration: Add marketing role
-- Description: Adds a new 'marketing' role to the user_role enum and updates RLS policies
-- This role is designed for demonstration purposes with access to marketing tools only

-- Step 1: Add 'marketing' to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'marketing';

-- Step 2: Create a function to check if user has marketing role
CREATE OR REPLACE FUNCTION public.is_marketing()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'marketing';
END;
$$;

COMMENT ON FUNCTION public.is_marketing() IS 'Returns true if the current user has the marketing role';

-- Step 3: Update profiles RLS policies to allow marketing users to view their own profile
-- Marketing users should NOT see other profiles (including leads)
CREATE POLICY "Marketing users can view their own profile"
ON public.profiles
FOR SELECT
USING (
    auth.uid() = id
    AND role = 'marketing'
);

-- Step 4: Allow marketing users to update their own profile (limited fields)
CREATE POLICY "Marketing users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND role = 'marketing')
WITH CHECK (
    auth.uid() = id
    AND role = 'marketing'
    -- Prevent marketing users from changing their role
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'marketing'
);

-- Step 5: Explicitly deny marketing users access to sensitive tables
-- financing_applications: Marketing should NOT see real applications
CREATE POLICY "Marketing users cannot access financing applications"
ON public.financing_applications
FOR ALL
USING (
    CASE
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'marketing'
        THEN FALSE
        ELSE TRUE
    END
);

-- uploaded_documents: Marketing should NOT see uploaded documents
CREATE POLICY "Marketing users cannot access uploaded documents"
ON public.uploaded_documents
FOR ALL
USING (
    CASE
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'marketing'
        THEN FALSE
        ELSE TRUE
    END
);

-- bank_profiles: Marketing should NOT see bank profiles
CREATE POLICY "Marketing users cannot access bank profiles"
ON public.bank_profiles
FOR ALL
USING (
    CASE
        WHEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'marketing'
        THEN FALSE
        ELSE TRUE
    END
);

-- Step 6: Grant marketing users read access to marketing-related tables
-- These tables don't contain sensitive user data

-- customer_journeys: Marketing can view and manage
CREATE POLICY "Marketing users can view customer journeys"
ON public.customer_journeys
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text, 'sales'::text]));

CREATE POLICY "Marketing users can manage customer journeys"
ON public.customer_journeys
FOR ALL
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text]))
WITH CHECK (public.is_marketing() OR public.get_my_role() = 'admin'::text);

-- marketing_landing_pages: Marketing can view and manage
CREATE POLICY "Marketing users can view landing pages"
ON public.marketing_landing_pages
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text]));

CREATE POLICY "Marketing users can manage landing pages"
ON public.marketing_landing_pages
FOR ALL
USING (public.is_marketing() OR public.get_my_role() = 'admin'::text)
WITH CHECK (public.is_marketing() OR public.get_my_role() = 'admin'::text);

-- custom_events: Marketing can view for analytics
CREATE POLICY "Marketing users can view custom events"
ON public.custom_events
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text]));

-- aggregated_metrics: Marketing can view for analytics
CREATE POLICY "Marketing users can view aggregated metrics"
ON public.aggregated_metrics
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text]));

-- anonymous_survey_responses: Marketing can view for analytics
CREATE POLICY "Marketing users can view anonymous survey responses"
ON public.anonymous_survey_responses
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text]));

-- app_config: Marketing can view configuration
CREATE POLICY "Marketing users can view app config"
ON public.app_config
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = ANY(ARRAY['admin'::text, 'sales'::text]));

-- homepage_content: Marketing can view and manage
CREATE POLICY "Marketing users can view homepage content"
ON public.homepage_content
FOR SELECT
USING (public.is_marketing() OR public.get_my_role() = 'admin'::text);

CREATE POLICY "Marketing users can manage homepage content"
ON public.homepage_content
FOR ALL
USING (public.is_marketing() OR public.get_my_role() = 'admin'::text)
WITH CHECK (public.is_marketing() OR public.get_my_role() = 'admin'::text);

-- Step 7: Create a function to get dummy CRM data for marketing users
-- This allows marketing users to see the CRM interface with fake data for demo purposes
CREATE OR REPLACE FUNCTION public.get_marketing_dummy_leads()
RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    phone text,
    role text,
    source text,
    created_at timestamptz,
    contactado boolean,
    tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow marketing users to call this function
    IF NOT public.is_marketing() THEN
        RAISE EXCEPTION 'Permission denied: Only marketing users can access dummy leads';
    END IF;

    -- Return dummy data for demonstration
    RETURN QUERY
    SELECT
        gen_random_uuid() as id,
        'demo' || i || '@ejemplo.com' as email,
        'Demo' as first_name,
        'Usuario ' || i::text as last_name,
        '811-123-' || lpad(i::text, 4, '0') as phone,
        'user' as role,
        CASE (i % 4)
            WHEN 0 THEN 'facebook'
            WHEN 1 THEN 'google'
            WHEN 2 THEN 'instagram'
            ELSE 'website'
        END as source,
        now() - (i || ' days')::interval as created_at,
        (i % 2 = 0) as contactado,
        ARRAY['demo', 'ejemplo']::text[] as tags
    FROM generate_series(1, 20) as i;
END;
$$;

COMMENT ON FUNCTION public.get_marketing_dummy_leads() IS 'Returns dummy lead data for marketing users to demonstrate CRM functionality';

-- Step 8: Add comment explaining the marketing role
COMMENT ON TYPE public.user_role IS 'User roles: user (regular customer), admin (full access), sales (sales team), marketing (marketing team - demo/analytics only, no access to real customer data)';
