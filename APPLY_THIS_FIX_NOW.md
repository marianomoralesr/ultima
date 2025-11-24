# 🚨 APLICAR ESTA MIGRACIÓN URGENTE

## ¿Por qué necesitas esto?

Al eliminar `get_my_role()` para arreglar el HTTP 556, **rompimos las políticas RLS** que permitían a admins y sales ver datos de usuarios.

**Ahora mismo:**
- ❌ Admins NO pueden ver perfiles de otros usuarios
- ❌ Sales NO pueden ver aplicaciones de sus leads asignados
- ❌ Admins NO pueden ver documentos subidos por usuarios

## 📋 INSTRUCCIONES

### Paso 1: Abrir SQL Editor

Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

### Paso 2: Copiar el SQL

Abre el archivo:
```
supabase/migrations/20251124000001_fix_broken_policies_after_dropping_get_my_role.sql
```

O copia directamente desde aquí (son 224 líneas):

```sql
[VER ARCHIVO: supabase/migrations/20251124000001_fix_broken_policies_after_dropping_get_my_role.sql]
```

### Paso 3: Pegar en SQL Editor

1. Selecciona TODO el contenido del archivo SQL
2. Pégalo en el SQL Editor de Supabase
3. Haz clic en **"RUN"** (botón verde abajo a la derecha)

### Paso 4: Verificar

Deberías ver este mensaje:
```
====================================
✅ RLS POLICIES FIXED
====================================

✓ profiles: Fixed role-based access
✓ financing_applications: Fixed admin/sales access
✓ uploaded_documents: Fixed CRUD policies
✓ user_vehicles_for_sale: Fixed access
✓ bank_financing_inquiries: Fixed access
====================================
```

### Paso 5: Probar

1. Inicia sesión como **admin**
2. Ve a `/escritorio/admin/crm`
3. Deberías ver todos los leads
4. Como **sales**, deberías ver solo tus leads asignados

## ⚠️ Importante

Esta migración NO causará recursión porque:
- ✅ Usa `EXISTS` con queries simples
- ✅ No llama a funciones dentro de políticas
- ✅ Las queries a `profiles` son directas y limitadas

## 🆘 Si hay algún error

Si al aplicar la migración sale algún error, avísame y te ayudo a resolverlo.

---

**Creado**: 24 nov 2025
**Archivo**: `supabase/migrations/20251124000001_fix_broken_policies_after_dropping_get_my_role.sql`
