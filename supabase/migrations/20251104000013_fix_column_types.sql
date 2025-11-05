-- Fix: Change column types that are jsonb to text
-- The error shows column 20 (rfdm) is jsonb but function expects text

-- First, check current column types
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '=== Current Column Types ===';
    FOR col_record IN
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'rfdm', 'referrer', 'landing_page', 'first_visit_at')
        ORDER BY column_name
    LOOP
        RAISE NOTICE '% : %', col_record.column_name, col_record.data_type;
    END LOOP;
END $$;

-- Change any jsonb columns to text (cast the data if needed)
DO $$
BEGIN
    -- Fix rfdm if it's jsonb
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'rfdm'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting rfdm from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN rfdm TYPE text USING rfdm::text;
    END IF;

    -- Fix other columns if needed
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'utm_source'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting utm_source from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN utm_source TYPE text USING utm_source::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'utm_medium'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting utm_medium from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN utm_medium TYPE text USING utm_medium::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'utm_campaign'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting utm_campaign from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN utm_campaign TYPE text USING utm_campaign::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'utm_term'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting utm_term from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN utm_term TYPE text USING utm_term::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'utm_content'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting utm_content from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN utm_content TYPE text USING utm_content::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'referrer'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting referrer from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN referrer TYPE text USING referrer::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'landing_page'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Converting landing_page from jsonb to text...';
        ALTER TABLE public.profiles
        ALTER COLUMN landing_page TYPE text USING landing_page::text;
    END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
    col_record RECORD;
    wrong_type_count INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== After Fix - Column Types ===';
    FOR col_record IN
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'rfdm', 'referrer', 'landing_page')
        ORDER BY column_name
    LOOP
        RAISE NOTICE '% : %', col_record.column_name, col_record.data_type;
        IF col_record.data_type != 'text' THEN
            wrong_type_count := wrong_type_count + 1;
        END IF;
    END LOOP;

    IF wrong_type_count > 0 THEN
        RAISE EXCEPTION '% columns still have wrong type!', wrong_type_count;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✓ All source tracking columns are now text type';
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

RAISE NOTICE '';
RAISE NOTICE '=== Migration Complete ===';
RAISE NOTICE '1. Column types fixed';
RAISE NOTICE '2. PostgREST schema cache reloaded';
RAISE NOTICE '3. Test the CRM page now';
