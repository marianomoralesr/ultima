#!/bin/bash

# Script para aplicar las migraciones RLS necesarias

echo "🚀 Aplicando migraciones RLS..."
echo ""

# URL de conexión de Supabase
DB_URL="postgresql://postgres.jjepfehmuybpctdzipnu:Guzmanmorales123!@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "1️⃣ Aplicando migración: remove_asesor_autorizado_constraint_global.sql"
psql "$DB_URL" -f supabase/migrations/20251203000000_remove_asesor_autorizado_constraint_global.sql

echo ""
echo "2️⃣ Aplicando migración: fix_profiles_insert_policy.sql"
psql "$DB_URL" -f supabase/migrations/20251203140000_fix_profiles_insert_policy.sql

echo ""
echo "✅ Migraciones aplicadas exitosamente"
