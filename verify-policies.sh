#!/bin/bash

# Script para verificar el estado actual de las políticas RLS

DB_URL="postgresql://postgres.jjepfehmuybpctdzipnu:Guzmanmorales123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "🔍 Verificando políticas RLS actuales..."
echo ""

psql "$DB_URL" << 'EOF'

-- 1. Verificar todas las políticas de profiles
\echo '==================== POLÍTICAS DE PROFILES ===================='
SELECT
  policyname,
  cmd,
  roles::text,
  CASE
    WHEN policyname LIKE '%insert%' THEN '✅ INSERT'
    WHEN policyname LIKE '%select%' THEN '✅ SELECT'
    WHEN policyname LIKE '%update%' THEN '✅ UPDATE'
    ELSE 'OTRA'
  END as tipo
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 2. Ver si la política SELECT de profiles tiene el constraint de asesor_autorizado_acceso
\echo ''
\echo '==================== CONTENIDO DE profiles_select ===================='
SELECT
  policyname,
  pg_get_expr(qual, polrelid) as using_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'profiles'
  AND policyname = 'profiles_select';

-- 3. Verificar políticas de financing_applications
\echo ''
\echo '==================== POLÍTICAS DE FINANCING_APPLICATIONS ===================='
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename = 'financing_applications'
ORDER BY cmd, policyname;

-- 4. Ver el contenido de financing_apps_select
\echo ''
\echo '==================== CONTENIDO DE financing_apps_select ===================='
SELECT
  policyname,
  pg_get_expr(qual, polrelid) as using_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'financing_applications'
  AND policyname = 'financing_apps_select';

-- 5. Verificar función get_sales_assigned_leads
\echo ''
\echo '==================== FUNCIÓN get_sales_assigned_leads ===================='
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_sales_assigned_leads'
LIMIT 1;

-- 6. Buscar referencias a asesor_autorizado_acceso en políticas
\echo ''
\echo '==================== BUSCAR asesor_autorizado_acceso ===================='
SELECT
  tablename,
  policyname,
  CASE
    WHEN pg_get_expr(qual, polrelid) LIKE '%asesor_autorizado_acceso%' THEN '❌ SÍ TIENE CONSTRAINT'
    ELSE '✅ NO TIENE CONSTRAINT'
  END as tiene_constraint
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'financing_applications', 'uploaded_documents', 'bank_profiles');

EOF

echo ""
echo "✅ Verificación completa"
