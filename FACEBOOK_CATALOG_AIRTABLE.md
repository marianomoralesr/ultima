# Catálogo de Facebook desde Airtable

## 📋 Resumen

Este documento describe la implementación de un feed CSV de Facebook Catalog que obtiene datos directamente desde la vista "Facebook Catalogo" en Airtable, sin afectar el sistema de tracking existente que usa `inventario_cache`.

## 🎯 Objetivo

Crear un catálogo de Facebook que:
- ✅ Obtiene datos en tiempo real desde la vista específica de Airtable "Facebook Catalogo"
- ✅ Usa la imagen específica `Foto Facebook` para cada vehículo
- ✅ Utiliza `ordencompra` como ID único para sincronización con el sistema local
- ✅ Es públicamente accesible y descargable desde el navegador
- ✅ Se actualiza automáticamente con los cambios en Airtable
- ✅ No interfiere con el sistema de tracking existente (Facebook Pixel)

## 🏗️ Arquitectura

### Edge Function: `facebook-catalog-feed`

**URL Pública:**
```
https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-catalog-feed
```

**Ubicación del código:**
```
supabase/functions/facebook-catalog-feed/index.ts
```

### Fuente de Datos

**Vista de Airtable:** Facebook Catalogo
- Base ID: `appbOPKYqQRW2HgyB`
- Table ID: `tblOjECDJDZlNv8At` (Inventario)
- View ID: `viwfybc9ldi49Ul4p` (Facebook Catalogo)
- URL: https://airtable.com/appbOPKYqQRW2HgyB/tblOjECDJDZlNv8At/viwfybc9ldi49Ul4p?blocks=hide

## 📊 Mapeo de Campos

| Campo Facebook Catalog | Campo Airtable | Descripción |
|----------------------|----------------|-------------|
| `id` | `ordencompra` / `OrdenCompra` | ID único del vehículo |
| `title` | `Auto` | Título del vehículo (ej: "Mazda 3i 2024") |
| `description` | `description` (fallback: `Auto`) | Descripción completa de marketing |
| `image_link` | `Foto Facebook` → R2 | Imagen descargada de Airtable, subida a R2, servida desde CDN `images.trefa.mx` |
| `additional_image_link` | `fotos_exterior_url` + `fotos_interior_url` | Imágenes adicionales (hasta 20) |
| `link` | `liga_catalogo_fb` (fallback: `Publicacion  Web`) | URL completa con tracking `?rfdm=fb_catalogos` |
| `price` | `Precio` | Precio en MXN |
| `brand` | `Automarca` / `AutoMarca` | Marca del vehículo |
| `availability` | Calculado | "in stock", "out of stock", "preorder" |
| `condition` | `"used"` | Siempre "used" (seminuevos) |
| `quantity_to_sell_on_facebook` | `"1"` | Constante: 1 unidad por vehículo |
| `currency` | `"MXN"` | Constante: Pesos mexicanos |
| `status` | `"active"` | Constante: Todos los vehículos activos |
| `custom_label_1` | `ClasificacionID` / `carroceria` | Tipo de vehículo (SUV, Sedán, Pick Up, Hatchback, etc.) |

## 🔄 Lógica de Disponibilidad

La disponibilidad se determina según los siguientes criterios:

```typescript
if (vendido === true) → "out of stock"
if (separado === true) → "preorder"
if (OrdenStatus === "Comprado") → "in stock"
if (stock === "disponible") → "in stock"
else → "out of stock"
```

## 🚀 Uso

### Acceso Directo

Descarga el CSV directamente desde tu navegador:
```
https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-catalog-feed
```

### Forzar Actualización

Para ignorar la caché y obtener datos frescos:
```
https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-catalog-feed?force=true
```

### Configuración en Facebook Business Manager

1. Ve a **Catálogos** → **Fuentes de datos**
2. Selecciona **Agregar elementos** → **Usar feeds de datos**
3. Elige **Programar una carga recurrente**
4. Introduce la URL:
   ```
   https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-catalog-feed
   ```
5. Configura la frecuencia de actualización (recomendado: cada hora)

## ⚙️ Configuración Técnica

### Variables de Entorno Requeridas

La función utiliza los siguientes secretos de Supabase (ya configurados):

```bash
AIRTABLE_API_KEY=pat_xxxxx  # Personal Access Token de Airtable
PUBLIC_SITE_URL=https://trefa.mx  # URL base del sitio
```

### Verificar Secretos

```bash
npx supabase secrets list
```

### Desplegar la Función

```bash
npx supabase functions deploy facebook-catalog-feed --no-verify-jwt
```

## 📈 Características

### 🚀 Optimización de Imágenes con R2/CDN
- **Descarga automática** de imágenes desde Airtable
- **Upload a Cloudflare R2** para almacenamiento permanente
- **Servicio desde CDN** `images.trefa.mx` para máxima velocidad
- **URLs permanentes** - no expiran como las de Airtable
- **Procesamiento paralelo** de todas las imágenes con `Promise.all`
- **Fallback automático** - usa Airtable si R2 falla

### Caché Inteligente
- **TTL**: 1 hora (3600 segundos)
- El CSV se genera una vez y se sirve desde caché
- Usar `?force=true` para actualizar antes del TTL
- Las imágenes R2 se cachean permanentemente

### Manejo de Errores
- Validación de campos requeridos antes de incluir en el CSV
- Logs detallados de registros omitidos
- Manejo graceful de campos faltantes con fallbacks
- Fallback a URLs de Airtable si R2 no está disponible

### Escalabilidad
- Paginación automática (100 registros por página)
- Sin límite de registros (hasta el máximo de Airtable)
- CORS habilitado para acceso desde cualquier origen
- Upload paralelo de imágenes para máximo rendimiento

## 🔍 Validaciones

Cada registro debe cumplir con:
1. ✅ Tener campo `ordencompra` o `OrdenCompra`
2. ✅ Tener campo `Auto` (título)
3. ✅ Tener al menos una imagen en `Foto Facebook`

Registros que no cumplan serán omitidos con un warning en los logs.

## 📝 Formato CSV

El CSV generado sigue el formato estándar de Facebook:

```csv
id,title,description,availability,condition,price,link,image_link,brand,additional_image_link
ID001638,Mercedes Benz GLE43 AMG 2019,Mercedes Benz GLE43 AMG 2019,in stock,used,1149900.00 MXN,https://trefa.mx/autos/ID001638,https://...,Mercedes Benz,https://...
```

## 🔄 Sincronización con Sistema Local

### ID de Vehículo: `ordencompra`

El campo `ordencompra` es el puente entre:
- **Airtable** → Vista "Facebook Catalogo"
- **Supabase** → Tabla `inventario_cache`
- **Facebook Catalog** → Campo `id` del producto

Esto permite:
- Tracking consistente entre sistemas
- Sincronización automática de datos
- Atribución correcta de eventos de Facebook Pixel

### No Afecta el Sistema de Tracking

Esta implementación es completamente independiente de:
- `supabase/functions/facebook-inventory-feed-csv/index.ts` (feed desde `inventario_cache`)
- Tabla `facebook_catalogue_events` (tracking de eventos)
- `FacebookPixelService.ts` (tracking de interacciones)

## 🛠️ Troubleshooting

### El CSV está vacío
1. Verifica que la vista "Facebook Catalogo" tenga registros
2. Confirma que los registros tengan los campos requeridos:
   - `ordencompra` / `OrdenCompra`
   - `Auto`
   - `Foto Facebook`

### Error 500
1. Verifica que `AIRTABLE_API_KEY` esté configurado:
   ```bash
   npx supabase secrets list | grep AIRTABLE
   ```
2. Revisa los logs de la función (disponibles en Supabase Dashboard)

### Campos faltantes en el CSV
1. Verifica los nombres exactos de los campos en Airtable
2. La función tiene fallbacks para:
   - `ordencompra` → `OrdenCompra` → `record.id`
   - `Automarca` → `AutoMarca` → `""`

### Imágenes no se muestran
1. Verifica que las URLs de Airtable no hayan expirado
2. Las URLs de Airtable incluyen tokens de autenticación temporales
3. Facebook cachea las imágenes, por lo que las URLs temporales no son problema

## 📊 Monitoreo

### Verificar la Salida

```bash
# Descargar el CSV
curl "https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/facebook-catalog-feed" -o catalog.csv

# Contar registros
wc -l catalog.csv

# Ver primeros registros
head -10 catalog.csv
```

### Logs de la Función

Ve al Dashboard de Supabase:
```
https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/functions
```

Selecciona `facebook-catalog-feed` para ver:
- Logs de ejecución
- Errores
- Estadísticas de uso

## 🔐 Seguridad

### Sin Autenticación Requerida
- La función usa `--no-verify-jwt` para acceso público
- Esto es necesario para que Facebook pueda descargar el feed
- Solo expone datos públicos de vehículos

### Rate Limiting
- Implementado por Supabase Edge Functions
- Caché de 1 hora reduce llamadas a Airtable API
- Airtable tiene límite de 5 requests/segundo

## 📞 Mantenimiento

### Actualizar la Función

1. Edita el archivo:
   ```
   supabase/functions/facebook-catalog-feed/index.ts
   ```

2. Despliega los cambios:
   ```bash
   npx supabase functions deploy facebook-catalog-feed --no-verify-jwt
   ```

### Cambiar la Vista de Airtable

Para usar una vista diferente, actualiza en `index.ts`:

```typescript
const AIRTABLE_VIEW_ID = 'viwNUEVAVISTA';
```

## 🎉 Ventajas vs Feed desde inventario_cache

| Característica | Feed Airtable | Feed inventario_cache |
|---------------|---------------|---------------------|
| **Imagen específica** | ✅ `Foto Facebook` | ❌ `feature_image_url` |
| **Datos en tiempo real** | ✅ Vista Airtable | ⚠️ Depende de sync |
| **Control de catálogo** | ✅ Vista filtrable | ❌ Lógica en código |
| **Sincronización** | ✅ Automática | ⚠️ Requiere webhook |
| **Imágenes CDN** | ❌ URLs de Airtable | ✅ Cloudflare CDN |
| **Custom labels** | ❌ No implementado | ✅ 5 labels segmentados |

## 📝 Próximos Pasos Recomendados

1. **Monitorear el rendimiento** en Facebook Catalog Manager
2. **Comparar resultados** con el feed anterior desde `inventario_cache`
3. **Considerar migrar imágenes** a Cloudflare R2 para URLs permanentes
4. **Agregar custom labels** si se necesita segmentación avanzada
5. **Configurar alertas** en Supabase para monitorear errores

---

**Última actualización:** 29 de noviembre de 2025
**Versión:** 1.0.0
**Autor:** Sistema de Marketing TREFA
