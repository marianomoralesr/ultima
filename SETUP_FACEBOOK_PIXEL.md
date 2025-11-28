# 🚀 Setup y Verificación de Facebook Pixel Integration

## ✅ Checklist de Verificación

### 1. Aplicar Migración de Base de Datos

**⚠️ IMPORTANTE:** Esta migración debe aplicarse para que el tracking funcione.

#### Paso 1: Verificar si la tabla existe

1. Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
2. Ejecuta:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'facebook_catalogue_events'
);
```

3. Si el resultado es **`false`**, continúa al Paso 2
4. Si el resultado es **`true`**, ¡la tabla ya existe! Salta a la sección "Verificación de Funciones"

#### Paso 2: Aplicar la migración

Copia y pega TODO el contenido del archivo:
```
supabase/migrations/20251127000000_create_facebook_catalogue_events.sql
```

En: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

Luego presiona **RUN** o **Ejecutar**.

---

### 2. Verificar Funciones RPC

Ejecuta este SQL para verificar que las funciones existen:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_catalogue_metrics',
    'get_top_performing_vehicles'
  );
```

**Deberías ver 2 funciones:**
- `get_catalogue_metrics`
- `get_top_performing_vehicles`

---

### 3. Verificar Vista

```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'catalogue_funnel_by_vehicle';
```

**Debería retornar:** `catalogue_funnel_by_vehicle`

---

### 4. Probar Inserción de Evento

Ejecuta este test para verificar que puedes insertar eventos:

```sql
INSERT INTO public.facebook_catalogue_events (
  event_type,
  vehicle_id,
  vehicle_data,
  session_id,
  metadata
) VALUES (
  'ViewContent',
  'test_vehicle_123',
  '{"id": "test_vehicle_123", "title": "Test Vehicle", "price": 100000}'::jsonb,
  'test_session_' || gen_random_uuid()::text,
  '{"test": true}'::jsonb
) RETURNING id, event_type, created_at;
```

**Debería retornar:** Un UUID, 'ViewContent', y un timestamp

---

### 5. Verificar Permisos

```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'facebook_catalogue_events';
```

**Deberías ver permisos para:**
- `authenticated`: SELECT, INSERT
- `anon`: SELECT, INSERT

---

### 6. Probar Funciones RPC

#### Test get_catalogue_metrics:

```sql
SELECT * FROM get_catalogue_metrics(
  NOW() - INTERVAL '7 days',
  NOW()
);
```

#### Test get_top_performing_vehicles:

```sql
SELECT * FROM get_top_performing_vehicles(
  NOW() - INTERVAL '7 days',
  NOW(),
  5
);
```

---

## 📊 Componentes del Sistema

### A. Backend

✅ **Edge Function:** `facebook-inventory-feed`
- URL: `https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-inventory-feed`
- Genera CSV con 692 vehículos disponibles
- Custom labels optimizadas
- Filtros: `ordenstatus='Comprado'`, `vendido=false`, `separado=false|null`

✅ **Tabla:** `facebook_catalogue_events`
- Almacena todos los eventos de Facebook Pixel
- Campos: event_type, vehicle_id, vehicle_data, session_id, fbclid, etc.
- Índices optimizados para queries rápidas
- RLS configurado (anon puede INSERT, solo admins pueden SELECT)

✅ **Funciones RPC:**
1. `get_catalogue_metrics()` - Métricas generales
2. `get_top_performing_vehicles()` - Top vehículos por rendimiento

✅ **Vista:** `catalogue_funnel_by_vehicle`
- Análisis de embudo por vehículo individual

### B. Frontend

✅ **Servicio:** `FacebookPixelService.ts`
- Tracking de eventos ViewContent, Search, AddToCart, InitiateCheckout, Lead
- Doble tracking: Facebook Pixel + Supabase
- Captura de fbclid automática
- Gestión de sesiones

✅ **Páginas con Tracking:**
1. **VehicleDetailPage** - ViewContent, AddToCart (calculator, whatsapp), InitiateCheckout
2. **VehicleListPage** - Search (con filtros)

✅ **Dashboard:** `FacebookCatalogueDashboard.tsx`
- Ruta: `/escritorio/admin/facebook-catalogue`
- Métricas en tiempo real
- Top vehículos
- Análisis de interacciones
- Exportación de datos

### C. Routing

✅ **App.tsx**
- Ruta agregada: `/admin/facebook-catalogue`
- Lazy loading del dashboard

---

## 🔗 Compatibilidad entre Componentes

### FacebookPixelService ↔ facebook_catalogue_events

```typescript
// FacebookPixelService.ts inserta con estos campos:
{
  event_type: 'ViewContent' | 'Search' | 'AddToCart' | 'InitiateCheckout' | 'Lead',
  vehicle_id: string,
  vehicle_data: {
    id, title, price, brand, model, year, category, slug
  },
  session_id: string,
  user_id: UUID | null,
  fbclid: string | null,
  interaction_type: string | null, // Para AddToCart
  search_query: string | null, // Para Search
  metadata: JSON
}
```

✅ **Compatible** con esquema de tabla

### FacebookCatalogueDashboard ↔ RPC Functions

```typescript
// Dashboard llama a:
supabase.rpc('get_catalogue_metrics', { start_date, end_date })
supabase.rpc('get_top_performing_vehicles', { start_date, end_date, limit_count })
```

✅ **Compatible** - Nombres de funciones coinciden
✅ **Compatible** - Parámetros coinciden
✅ **Compatible** - Tipos de retorno coinciden

### facebook-inventory-feed ↔ VehicleService

✅ **Campos coinciden:**
- Ambos leen de `inventario_cache`
- Ambos usan `getFirstOrString()` para campos JSONB
- Campo correcto: `transmision` (no `autotransmision`)
- Filtros consistentes: `ordenstatus='Comprado'`, `vendido=false`

✅ **URLs coinciden:**
- Edge function: `/autos/{slug}`
- VehicleDetailPage: `/autos/:slug`
- Facebook Pixel tracking: Mismo vehículo ID

---

## 🎯 Testing del Flujo Completo

### Flujo Expected:

1. **Usuario entra a `/autos/toyota-camry-2020`**
   - ✅ VehicleDetailPage carga vehículo
   - ✅ FacebookPixelService.trackViewContent() se dispara
   - ✅ Evento se guarda en `facebook_catalogue_events`
   - ✅ Facebook Pixel recibe evento

2. **Usuario hace clic en "Calculadora"**
   - ✅ Tab cambia a calculator
   - ✅ FacebookPixelService.trackAddToCart(vehicle, 'calculator')
   - ✅ Evento guardado con `interaction_type='calculator'`

3. **Usuario hace clic en WhatsApp**
   - ✅ FacebookPixelService.trackAddToCart(vehicle, 'whatsapp')
   - ✅ Evento guardado con `interaction_type='whatsapp'`

4. **Usuario hace clic en "Comprar con financiamiento"**
   - ✅ FacebookPixelService.trackInitiateCheckout(vehicle)
   - ✅ Evento guardado como 'InitiateCheckout'
   - ✅ Navega a formulario

5. **Admin ve dashboard en `/admin/facebook-catalogue`**
   - ✅ Dashboard carga métricas usando `get_catalogue_metrics()`
   - ✅ Muestra top vehículos usando `get_top_performing_vehicles()`
   - ✅ Muestra análisis de interacciones
   - ✅ Puede exportar datos

---

## 🚨 Troubleshooting

### Problema: "Table facebook_catalogue_events does not exist"

**Solución:** Aplicar la migración (ver Paso 2 arriba)

### Problema: "Function get_catalogue_metrics does not exist"

**Solución:** La migración no se aplicó completamente. Volver a ejecutar todo el SQL.

### Problema: "Permission denied for table facebook_catalogue_events"

**Solución:** Verificar que los permisos están correctos (ver Paso 5)

### Problema: No se guardan eventos desde el frontend

**Solución:**
1. Verificar que la política RLS permite INSERT para anon
2. Verificar en console del browser si hay errores
3. Verificar que `supabaseClient` está correctamente configurado

### Problema: Dashboard no carga datos

**Solución:**
1. Verificar que el usuario es admin (`role='admin'` en profiles)
2. Verificar que las funciones RPC existen
3. Revisar console del browser por errores

---

## ✅ Checklist Final

Antes de considerarlo completo, verifica:

- [ ] Tabla `facebook_catalogue_events` existe
- [ ] Funciones `get_catalogue_metrics` y `get_top_performing_vehicles` existen
- [ ] Vista `catalogue_funnel_by_vehicle` existe
- [ ] Permisos RLS correctos (anon INSERT, admins SELECT)
- [ ] FacebookPixelService importado en VehicleDetailPage y VehicleListPage
- [ ] Dashboard accesible en `/admin/facebook-catalogue`
- [ ] Ruta agregada en App.tsx
- [ ] Edge function `facebook-inventory-feed` desplegada
- [ ] URL configurada en Facebook Catalogue Manager
- [ ] Evento de prueba insertado correctamente
- [ ] Dashboard muestra datos correctamente

---

## 📞 Referencias

- **Supabase Dashboard:** https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu
- **SQL Editor:** https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
- **Edge Functions:** https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions
- **Facebook Events Manager:** https://business.facebook.com/events_manager
- **Facebook Catalogue Manager:** https://business.facebook.com/products/catalogs

---

**Última actualización:** 27 de noviembre de 2024
**Versión:** 1.0.0
