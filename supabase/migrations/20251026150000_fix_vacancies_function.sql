-- Fix get_vacancies_with_application_count function to use correct table name
CREATE OR REPLACE FUNCTION "public"."get_vacancies_with_application_count"()
RETURNS TABLE(
  "id" "uuid",
  "title" "text",
  "location" "text",
  "job_type" "text",
  "salary_range" "text",
  "description" "text",
  "requirements" "text",
  "benefits" "text",
  "status" "text",
  "schedule" "text",
  "image_url" "text",
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "application_count" bigint
)
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
BEGIN
    -- Check authorization
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'sales')
    ) THEN
        RAISE EXCEPTION 'Permission denied to access vacancies with counts';
    END IF;

    RETURN QUERY
    SELECT
        v.id,
        v.title,
        v.location,
        v.job_type,
        v.salary_range,
        v.description,
        v.requirements,
        v.benefits,
        v.status,
        v.schedule,
        v.image_url,
        v.created_at,
        v.updated_at,
        COALESCE(COUNT(ja.id), 0)::bigint as application_count
    FROM
        vacancies v
    LEFT JOIN job_applications ja ON ja.vacancy_id = v.id
    GROUP BY v.id, v.title, v.location, v.job_type, v.salary_range, v.description,
             v.requirements, v.benefits, v.status, v.schedule, v.image_url,
             v.created_at, v.updated_at
    ORDER BY v.created_at DESC;
END;
$$;

COMMENT ON FUNCTION "public"."get_vacancies_with_application_count"() IS 'Returns all vacancies with application counts. Requires admin or sales role. Fixed to use job_applications table instead of vacancy_applications.';
