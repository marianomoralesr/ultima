# Mejores Prácticas para RLS en Supabase

## ⚠️ Lección Aprendida: Evitar Recursión Infinita

### Problema que Tuvimos (24 Nov 2025)

**Síntoma**: HTTP 556, Auth y REST API "unhealthy"

**Causa**: Función `get_my_role()` creando recursión infinita:
```sql
-- ❌ MAL - Causa recursión infinita
CREATE FUNCTION get_my_role()
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Y luego una política que la usa:
CREATE POLICY "profiles_select" ON profiles
USING (
  -- Esta política llama a get_my_role()
  -- Que intenta leer profiles
  -- Que activa esta política de nuevo
  -- LOOP INFINITO → Auth service crash
  (SELECT get_my_role()) = 'admin'
);
```

### ✅ Solución Aplicada

```sql
-- Eliminamos la función recursiva
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Usamos políticas simples que no causan recursión
CREATE POLICY "profiles_select_own" ON profiles
FOR SELECT TO authenticated
USING (id = auth.uid()); -- Solo auth.uid(), sin funciones
```

## 📋 Reglas de Oro para RLS

### 1. **Nunca hagas queries dentro de funciones usadas en RLS**

```sql
-- ❌ MAL
CREATE FUNCTION get_user_role()
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ✅ BIEN - Usa JWT claims directamente
CREATE FUNCTION get_user_role()
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'user'
  );
$$;
```

### 2. **Mantén las políticas RLS simples**

```sql
-- ❌ MAL - Muy complejo, difícil de debuggear
CREATE POLICY complex_policy ON table_name
USING (
  EXISTS (
    SELECT 1 FROM other_table
    WHERE some_function(column)
    AND another_subquery()
  )
);

-- ✅ BIEN - Simple y directo
CREATE POLICY simple_policy ON table_name
USING (user_id = auth.uid());
```

### 3. **Usa SECURITY DEFINER solo cuando sea necesario**

```sql
-- SECURITY DEFINER bypasea RLS
-- Úsalo solo para funciones administrativas
-- NO para funciones llamadas desde políticas RLS
```

### 4. **Prueba políticas RLS antes de deploy**

```sql
-- Simula ser un usuario específico
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"user-uuid","role":"user"}';

-- Prueba tu query
SELECT * FROM profiles; -- ¿Funciona? ¿Es rápido?
```

### 5. **Monitorea el health status**

- Dashboard > Project Settings > General
- Si ves "unhealthy", revisa logs inmediatamente
- Dashboard > Logs > Postgres Logs

## 🔧 Debugging RLS Issues

### Síntomas de Recursión:

- ✅ HTTP 556 en todas las requests
- ✅ Auth service "unhealthy"
- ✅ REST API "unhealthy"
- ✅ Timeout en queries simples

### Cómo Diagnosticar:

```sql
-- 1. Listar todas las funciones que leen profiles
SELECT proname, pg_get_functiondef(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosrc ILIKE '%FROM profiles%';

-- 2. Listar políticas que usan funciones
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE qual ILIKE '%(%'
ORDER BY schemaname, tablename;

-- 3. Verificar ownership de tablas auth
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'auth';
```

### Solución Rápida:

```sql
-- Eliminar función problemática
DROP FUNCTION IF EXISTS nombre_funcion() CASCADE;

-- Simplificar política
DROP POLICY nombre_policy ON table_name;
CREATE POLICY nombre_policy_simple ON table_name
USING (id = auth.uid());
```

## 📚 Recursos

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Troubleshooting HTTP Status Codes](https://supabase.com/docs/guides/troubleshooting/http-status-codes)

## ✅ Checklist Pre-Deploy

Antes de hacer push de migraciones con RLS:

- [ ] Las políticas usan solo `auth.uid()` o JWT claims
- [ ] No hay funciones que hagan queries dentro de políticas RLS
- [ ] No hay loops potenciales (tabla A → tabla B → tabla A)
- [ ] Las funciones SECURITY DEFINER son mínimas
- [ ] Probé las políticas localmente con `SET LOCAL role`
- [ ] Revisé que las políticas sean eficientes (sin N+1 queries)

---

**Fecha**: 24 de noviembre de 2025
**Incidente**: HTTP 556 por recursión en `get_my_role()`
**Duración**: ~30 minutos
**Solución**: Drop función + restart proyecto
**Status**: ✅ Resuelto
