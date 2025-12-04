# Integración Completa de Facebook Pixel y Catálogo

## 📊 Resumen

Este documento describe la implementación completa de la integración de Facebook Pixel con el catálogo de vehículos de TREFA. El sistema ahora rastrea eventos estándar de e-commerce de Meta y proporciona análisis detallados de rendimiento del catálogo.

## 🎯 Objetivos Alcanzados

✅ **Tracking Completo de Eventos**
- ViewContent cuando usuarios ven vehículos
- Search cuando usuarios buscan/filtran inventario
- AddToCart cuando usuarios interactúan (calculadora, WhatsApp)
- InitiateCheckout cuando usuarios inician financiamiento
- Lead cuando usuarios completan formularios

✅ **Integración con Catálogo de Facebook**
- Los IDs de eventos coinciden con los IDs del catálogo CSV
- Atribución correcta de conversiones desde anuncios de Facebook
- Tracking de fbclid para atribución de campañas

✅ **Dashboard de Visualización**
- Métricas generales del catálogo
- Top vehículos por rendimiento
- Análisis de interacciones
- Tasas de conversión por vehículo

## 🏗️ Arquitectura de la Solución

### 1. Servicio de Facebook Pixel (`FacebookPixelService.ts`)

**Ubicación:** `src/services/FacebookPixelService.ts`

#### Características:
- Servicio singleton para gestión centralizada de eventos
- Inicialización automática con Pixel ID desde configuración
- Tracking dual: Facebook Pixel + Base de datos Supabase
- Captura automática de fbclid para atribución
- Manejo de sesiones para análisis de comportamiento

#### Eventos Implementados:

```typescript
// ViewContent - Usuario ve un vehículo
facebookPixelService.trackViewContent({
  id: vehicleId,
  title: vehicleTitle,
  price: vehiclePrice,
  brand: brand,
  model: model,
  year: year,
  category: category,
  slug: slug,
  image_url: imageUrl
});

// Search - Usuario busca vehículos
facebookPixelService.trackSearch(searchQuery, filters);

// AddToCart - Usuario interactúa (calculadora, whatsapp)
facebookPixelService.trackAddToCart(vehicleData, 'calculator');
facebookPixelService.trackAddToCart(vehicleData, 'whatsapp');

// InitiateCheckout - Usuario inicia financiamiento
facebookPixelService.trackInitiateCheckout(vehicleData);

// Lead - Usuario completa formulario
facebookPixelService.trackLead(vehicleData, leadValue);
```

### 2. Implementación en Páginas

#### VehicleDetailPage (`src/pages/VehicleDetailPage.tsx`)

**Eventos rastreados:**
- ✅ **ViewContent**: Automáticamente al cargar el vehículo
- ✅ **AddToCart**: Al hacer clic en la calculadora de financiamiento
- ✅ **AddToCart**: Al hacer clic en el botón de WhatsApp
- ✅ **InitiateCheckout**: Al hacer clic en "Comprar con financiamiento"

```typescript
// Ejemplo de implementación en VehicleDetailPage
useEffect(() => {
  if (vehicleData) {
    // Track ViewContent
    facebookPixelService.trackViewContent({
      id: vehicleData.record_id || vehicleData.id,
      title: vehicleData.titulo,
      price: vehicleData.autoprecio,
      brand: vehicleData.automarca,
      // ... más campos
    });
  }
}, [vehicleData]);

const handleTabChange = (tab) => {
  if (tab === 'calculator' && vehicle) {
    // Track AddToCart cuando usuario abre calculadora
    facebookPixelService.trackAddToCart(vehicleData, 'calculator');
  }
};

const handleWhatsAppClick = () => {
  // Track AddToCart cuando usuario hace clic en WhatsApp
  facebookPixelService.trackAddToCart(vehicleData, 'whatsapp');
};
```

#### VehicleListPage (`src/pages/VehicleListPage.tsx`)

**Eventos rastreados:**
- ✅ **Search**: Al aplicar filtros o búsquedas
- ✅ **Search**: Al cambiar parámetros de navegación

```typescript
// Track Search cuando filtros cambian
useEffect(() => {
  if (isInitialMount.current) return;

  const searchQuery = [
    filters.search,
    ...(filters.marca || []),
    ...(filters.carroceria || []),
    ...(filters.ubicacion || [])
  ].filter(Boolean).join(' ') || 'browse_inventory';

  facebookPixelService.trackSearch(searchQuery, filters);
}, [filters]);
```

### 3. Base de Datos

#### Tabla: `facebook_catalogue_events`

**Ubicación:** `supabase/migrations/20251127000000_create_facebook_catalogue_events.sql`

```sql
CREATE TABLE public.facebook_catalogue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'ViewContent', 'Search', 'AddToCart', 'InitiateCheckout', 'Lead', 'Purchase'
  )),
  vehicle_id TEXT,
  vehicle_data JSONB,
  search_query TEXT,
  interaction_type TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  fbclid TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Funciones RPC:

**1. get_catalogue_metrics**
```sql
SELECT * FROM get_catalogue_metrics(
  start_date := NOW() - INTERVAL '30 days',
  end_date := NOW()
);
```
Retorna:
- total_views
- total_searches
- total_add_to_cart
- total_checkouts
- total_leads
- unique_vehicles_viewed
- conversion_rate

**2. get_top_performing_vehicles**
```sql
SELECT * FROM get_top_performing_vehicles(
  start_date := NOW() - INTERVAL '30 days',
  end_date := NOW(),
  limit_count := 10
);
```
Retorna top vehículos con:
- vehicle_id
- vehicle_title
- vehicle_price
- view_count
- add_to_cart_count
- checkout_count
- lead_count
- conversion_rate

**3. Vista: catalogue_funnel_by_vehicle**
```sql
SELECT * FROM catalogue_funnel_by_vehicle;
```
Análisis del embudo de conversión por vehículo individual.

### 4. Dashboard de Facebook Catalogue

**Ubicación:** `src/pages/FacebookCatalogueDashboard.tsx`

**Ruta:** `/escritorio/admin/facebook-catalogue`

#### Características:

📊 **Métricas Generales:**
- Vistas totales de vehículos
- Búsquedas realizadas
- Interacciones (AddToCart)
- Solicitudes iniciadas (InitiateCheckout)
- Leads generados
- Tasa de conversión global

📈 **Análisis por Vehículo:**
- Top 10 vehículos por rendimiento
- Vistas, interacciones, solicitudes y leads por vehículo
- Tasa de conversión individual
- Ordenamiento por engagement

💡 **Tipos de Interacción:**
- Desglose de cómo los usuarios interactúan:
  - calculator (abre calculadora de financiamiento)
  - whatsapp (contacta por WhatsApp)
  - contact (otros contactos)
  - favorite (agrega a favoritos)

📅 **Filtros de Fecha:**
- Últimos 7 días
- Últimos 30 días
- Últimos 90 días

⬇️ **Exportación de Datos:**
- Descarga de métricas en formato JSON
- Incluye todos los datos del período seleccionado

### 5. Integración con Catálogo CSV de Facebook

**Edge Function Existente:** `facebook-inventory-feed`

**Ubicación:** `supabase/functions/facebook-inventory-feed/index.ts`

La integración funciona perfectamente porque:

1. **IDs Coincidentes:** Los eventos de tracking usan el mismo ID que el catálogo
   ```typescript
   // En tracking
   id: vehicle.record_id || vehicle.id

   // En catálogo CSV
   id: row.record_id || String(row.id)
   ```

2. **Campos Consistentes:**
   - title → vehicle_title
   - price → vehicle_price
   - brand → vehicle_brand
   - category → vehicle_category (carroceria)

3. **URL de Producto:**
   ```typescript
   link: `${BASE_URL}/inventario/${row.slug}`
   // Coincide con la ruta donde se rastrea ViewContent
   ```

## 🔄 Flujo de Eventos

### Usuario Ve un Vehículo:

1. Usuario visita `/autos/toyota-camry-2020`
2. `VehicleDetailPage` carga el vehículo
3. **Evento ViewContent** se dispara:
   - Facebook Pixel registra el evento
   - Supabase guarda el evento en `facebook_catalogue_events`
   - Se captura fbclid si existe en la URL
   - Se crea/recupera session_id

### Usuario Interactúa:

4. Usuario hace clic en "Calculadora"
5. **Evento AddToCart** (tipo: calculator):
   - Facebook Pixel: AddToCart con interaction_type
   - Supabase: Registro con metadata de interacción

6. Usuario hace clic en WhatsApp
7. **Evento AddToCart** (tipo: whatsapp):
   - Facebook Pixel: AddToCart con content_ids
   - Supabase: Registro con vehicle_data completo

### Usuario Convierte:

8. Usuario hace clic en "Comprar con financiamiento"
9. **Evento InitiateCheckout**:
   - Facebook Pixel: InitiateCheckout con valor del vehículo
   - Supabase: Registro con vehicle_id y session_id
   - Redirección a página de aplicación

10. Usuario completa formulario
11. **Evento Lead** (desde otro componente):
    - Facebook Pixel: Lead con valor de conversión
    - Supabase: Registro final del embudo

## 📈 Análisis de Rendimiento

### Métricas Clave:

**Tasa de Conversión:**
```
conversion_rate = (total_leads / total_views) × 100
```

**Tasa de Interacción:**
```
interaction_rate = (total_add_to_cart / total_views) × 100
```

**Vistas Promedio por Vehículo:**
```
avg_views = total_views / unique_vehicles_viewed
```

### Optimización de Campañas:

1. **Identificar Vehículos de Alto Rendimiento:**
   - Vehículos con alta conversión (>5%)
   - Vehículos con bajo precio pero alto engagement
   - Vehículos populares por marca/categoría

2. **Analizar Puntos de Abandono:**
   - ViewContent → AddToCart (¿El precio es visible?)
   - AddToCart → InitiateCheckout (¿La calculadora es fácil?)
   - InitiateCheckout → Lead (¿El formulario es simple?)

3. **Atribución de Campañas:**
   - Eventos con fbclid se pueden atribuir a anuncios específicos
   - Comparar conversión de tráfico orgánico vs pagado
   - ROI por campaña de Facebook

## 🚀 Próximos Pasos Recomendados

### 1. Eventos Avanzados:

```typescript
// Tracking de tiempo en página
facebookPixelService.trackVehicleEngagement(vehicle, 'time_on_page_30s');

// Tracking de scroll depth
facebookPixelService.trackVehicleEngagement(vehicle, 'scrolled_75_percent');

// Purchase event cuando se cierra venta
facebookPixelService.trackPurchase(vehicle, transactionId);
```

### 2. Segmentación Avanzada:

- Crear audiencias personalizadas en Facebook basadas en:
  - Usuarios que vieron vehículos de cierta marca
  - Usuarios que usaron la calculadora pero no aplicaron
  - Usuarios que vieron vehículos >$500K

### 3. Dynamic Ads:

- Configurar anuncios dinámicos usando el catálogo
- Remarketing a usuarios que vieron vehículos específicos
- Cross-sell/upsell basado en vehículos similares

### 4. Pruebas A/B:

- Diferentes CTAs en VehicleDetailPage
- Diferentes posiciones de calculadora
- Diferentes formatos de precios (con/sin financiamiento)

## 🛠️ Mantenimiento

### Verificar Funcionamiento:

1. **Consola del navegador:**
   ```javascript
   // Verificar que Facebook Pixel está cargado
   console.log(window.fbq);

   // Ver eventos enviados
   // Buscar: [FB Pixel] en la consola
   ```

2. **Facebook Events Manager:**
   - Ir a https://business.facebook.com/events_manager
   - Verificar que los eventos están llegando
   - Revisar calidad de datos (Event Match Quality)

3. **Dashboard de Supabase:**
   ```sql
   -- Ver eventos recientes
   SELECT * FROM facebook_catalogue_events
   ORDER BY created_at DESC
   LIMIT 100;

   -- Verificar métricas
   SELECT * FROM get_catalogue_metrics(
     NOW() - INTERVAL '7 days',
     NOW()
   );
   ```

### Troubleshooting:

**Problema:** No se registran eventos
- Verificar que Facebook Pixel ID está configurado en `/admin/marketing-config`
- Verificar que fbq está definido (bloqueadores de anuncios)
- Revisar consola del navegador por errores

**Problema:** Eventos sin vehicle_id
- Verificar que `record_id` existe en `inventario_cache`
- Fallback a `id` si `record_id` es null

**Problema:** Bajo Event Match Quality
- Asegurar que se captura email cuando está disponible
- Agregar más parámetros de usuario (teléfono, nombre)
- Configurar Conversions API para server-side tracking

## 📞 Soporte

Para preguntas o soporte sobre esta integración:

- **Documentación de Facebook Pixel:** https://developers.facebook.com/docs/meta-pixel
- **Eventos estándar de Meta:** https://developers.facebook.com/docs/meta-pixel/reference
- **Catálogos de Facebook:** https://www.facebook.com/business/help/125074381480892

---

**Última actualización:** 27 de noviembre de 2024
**Versión:** 1.0.0
**Autor:** Sistema de Marketing TREFA
