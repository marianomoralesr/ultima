# ✅ Verificación de Integración Facebook Pixel - Próximos Pasos

## 📊 Estado Actual

### ✅ Código Frontend - VERIFICADO
- **FacebookPixelService**: Implementado correctamente en `src/services/FacebookPixelService.ts`
- **VehicleDetailPage**: Tracking de ViewContent, AddToCart, InitiateCheckout ✅
- **VehicleListPage**: Tracking de Search ✅
- **Dashboard**: Implementado en `src/pages/FacebookCatalogueDashboard.tsx` ✅
- **Routing**: Ruta configurada en App.tsx ✅

### ⏳ Base de Datos - PENDIENTE DE VERIFICAR
Ya aplicaste la migración, ahora necesitamos verificar que todo funcione.

---

## 🎯 Paso 1: Verificar Base de Datos (5 minutos)

### Opción A: Ejecutar Test Suite Completo

1. Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

2. Copia y pega **TODO** el contenido del archivo:
   ```
   test_fb_integration.sql
   ```

3. Presiona **RUN**

4. Revisa los resultados:
   - ✅ **Test 1-3**: Deben confirmar que tabla, funciones y vista existen
   - ✅ **Test 4-5**: Deben insertar eventos de prueba sin errores
   - ✅ **Test 6-7**: Deben retornar métricas calculadas
   - ✅ **Test 8**: Debe mostrar datos del funnel
   - ✅ **Test 9**: Debe mostrar permisos para `anon` y `authenticated`
   - ✅ **Test 10**: Debe listar los 5 eventos insertados

### Opción B: Verificación Rápida (2 minutos)

Ejecuta solo esto:

```sql
-- 1. ¿Existe la tabla?
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'facebook_catalogue_events'
) as tabla_existe;

-- 2. ¿Existen las funciones?
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_catalogue_metrics',
    'get_top_performing_vehicles'
  );

-- 3. Insertar evento de prueba
INSERT INTO public.facebook_catalogue_events (
  event_type,
  vehicle_id,
  vehicle_data,
  session_id
) VALUES (
  'ViewContent',
  'test_123',
  '{"id": "test_123", "title": "Test Vehicle", "price": 100000}'::jsonb,
  'test_session_' || gen_random_uuid()::text
) RETURNING id, event_type, created_at;
```

**Resultado esperado:**
- `tabla_existe`: `true`
- 2 funciones listadas
- 1 evento insertado con éxito

---

## 🎯 Paso 2: Probar Frontend (10 minutos)

### A. Verificar que el sitio compile

```bash
npm run dev
```

Verifica que no haya errores de TypeScript ni importaciones.

### B. Probar tracking en navegador

1. **Abre cualquier vehículo**: `/autos/[slug-de-vehiculo]`

2. **Abre Console del navegador** (F12 → Console)

3. **Busca estos mensajes**:
   ```
   [FB Pixel] 👁️ ViewContent: {id: "...", title: "..."}
   [FB Pixel] ✅ Evento guardado en Supabase
   ```

4. **Haz clic en "Calculadora"** → Deberías ver:
   ```
   [FB Pixel] 🛒 AddToCart: (calculator)
   ```

5. **Haz clic en WhatsApp** → Deberías ver:
   ```
   [FB Pixel] 🛒 AddToCart: (whatsapp)
   ```

6. **Haz clic en "Solicitar Financiamiento"** → Deberías ver:
   ```
   [FB Pixel] 💳 InitiateCheckout
   ```

### C. Verificar que eventos se guardan en Supabase

Después de interactuar con vehículos, ejecuta:

```sql
SELECT
  event_type,
  vehicle_id,
  vehicle_data->>'title' as vehicle_title,
  interaction_type,
  created_at
FROM public.facebook_catalogue_events
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 20;
```

**Deberías ver tus interacciones recientes.**

---

## 🎯 Paso 3: Probar Dashboard (5 minutos)

1. **Ve a**: `/escritorio/admin/facebook-catalogue`

2. **Verifica que cargue sin errores**

3. **Deberías ver**:
   - Métricas generales (pueden estar en 0 si no hay eventos reales)
   - Selector de rango de fechas (7d, 30d, 90d)
   - Tabla de top vehículos
   - Sección de interacciones

4. **Prueba cambiar el rango de fechas** y verifica que recalcula

5. **Prueba el botón "Exportar Datos"**

---

## 🎯 Paso 4: Verificar Facebook Pixel (Opcional)

Si tienes acceso a Facebook Events Manager:

1. Ve a: https://business.facebook.com/events_manager

2. Busca tu Pixel ID: `846689825695126`

3. Ve a **"Test Events"** o **"Live Events"**

4. Interactúa con tu sitio (visita vehículos, haz clic en botones)

5. **Deberías ver eventos llegando en tiempo real**:
   - ViewContent
   - Search
   - AddToCart
   - InitiateCheckout

6. Revisa **Event Match Quality** (debe ser >6.0 para buenos resultados)

---

## 🎯 Paso 5: Verificar Facebook Catalogue Feed

1. Verifica que la Edge Function esté desplegada:
   ```bash
   npx supabase functions list
   ```

2. Deberías ver: `facebook-inventory-feed`

3. Prueba el endpoint:
   ```bash
   curl https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-inventory-feed
   ```

4. Deberías ver un CSV con tus vehículos

5. **En Facebook Catalogue Manager**:
   - Ve a tu catálogo
   - Verifica que el feed esté sincronizando
   - Revisa si hay errores de validación

---

## 🐛 Troubleshooting Común

### Error: "Table facebook_catalogue_events does not exist"
**Solución**: La migración no se aplicó. Ejecuta Paso 1 de nuevo.

### Error: Console muestra "[FB Pixel] ❌ Error guardando en Supabase"
**Solución**:
1. Verifica permisos RLS con Test 9 de `test_fb_integration.sql`
2. Revisa que la tabla existe con Paso 1, Opción B

### Dashboard no carga (pantalla blanca)
**Solución**:
1. Abre Console del navegador (F12)
2. Busca errores relacionados con RPC
3. Verifica que las funciones existen (Paso 1)
4. Verifica que tu usuario es admin en `profiles.role`

### No veo eventos en Facebook
**Solución**:
1. Verifica que el Pixel ID sea correcto en `MarketingConfigService.ts`
2. Revisa que Meta Pixel script esté cargando (busca `fbq` en Console)
3. Asegúrate de no tener bloqueadores de ads activos

---

## ✅ Checklist Final

Antes de considerar la integración completa, verifica:

- [ ] Test suite completo pasa (Paso 1, Opción A)
- [ ] Eventos ViewContent se disparan al ver vehículos
- [ ] Eventos AddToCart se disparan en calculadora y WhatsApp
- [ ] Eventos InitiateCheckout se disparan en formulario
- [ ] Eventos se guardan correctamente en Supabase
- [ ] Dashboard carga sin errores
- [ ] Dashboard muestra métricas correctas
- [ ] Exportar datos funciona
- [ ] Facebook Events Manager recibe eventos (opcional)
- [ ] Facebook Catalogue sincroniza correctamente (opcional)

---

## 📞 Referencias Rápidas

- **Supabase SQL Editor**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new
- **Supabase Edge Functions**: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions
- **Facebook Events Manager**: https://business.facebook.com/events_manager
- **Facebook Catalogue Manager**: https://business.facebook.com/products/catalogs

---

## 🎉 ¿Todo funciona?

Si completaste todos los pasos exitosamente, **¡la integración está lista para producción!**

### Próximos pasos recomendados:

1. **Monitorear métricas** durante los primeros días
2. **Crear audiencias personalizadas** en Facebook usando los eventos
3. **Configurar campañas de retargeting** basadas en los eventos
4. **Optimizar custom labels** según rendimiento de anuncios
5. **Revisar Event Match Quality** regularmente en Facebook

---

**Fecha**: 28 de noviembre de 2024
**Versión**: 1.0.0
