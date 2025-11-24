# Guía de Customer Journeys - Implementación Completada

## Resumen Ejecutivo

Se ha implementado un sistema completo de rastreo de Customer Journeys con una **guía interactiva en español** directamente en la interfaz. La guía incluye ejemplos prácticos usando el caso de uso del **Catálogo de Facebook** para rastrear el interés de usuarios en vehículos específicos.

## ✅ Lo que se ha completado

### 1. Guía Interactiva en Español (`CustomerJourneysGuide.tsx`)

**Ubicación**: `src/components/CustomerJourneysGuide.tsx`

**Características**:
- ✅ Visible automáticamente al entrar a la página de Customer Journeys
- ✅ Secciones colapsables/expandibles para fácil navegación
- ✅ Botón para ocultar/mostrar la guía
- ✅ Diseño moderno con gradientes y colores distintivos
- ✅ 100% en español

**Contenido de la guía**:

#### Sección 1: ¿Qué son los Customer Journeys?
Explica el concepto y beneficios:
- Rastrear cada paso del usuario
- Identificar dónde se pierden usuarios
- Medir rendimiento de campañas de Facebook
- Optimizar embudo de conversión
- Envío automático a Facebook Pixel y GTM

#### Sección 2: Conceptos Clave
Define los términos importantes con ejemplos visuales:
- **Evento**: Acción del usuario (ver página, clic, enviar formulario)
- **Paso (Step)**: Punto específico en el journey
- **Trigger**: Condición que activa el evento
- **Facebook Pixel Event**: Evento estándar de Facebook

#### Sección 3: 📘 Ejemplo Práctico - Catálogo de Facebook
**Paso a paso completo** para rastrear interés en vehículos:

```
Objetivo: Rastrear usuarios interesados en vehículos específicos
```

**Paso 1: Crear el Journey**
```
Nombre: Interés en Vehículos - Catálogo FB
Ruta principal: /autos
Landing Page: /autos
Descripción: Rastrea usuarios que ven vehículos en el catálogo
```

**Paso 2: Agregar Pasos del Funnel**

**2.1. Usuario llega al catálogo**
```
Nombre del paso: Visita Catálogo de Autos
Ruta de la página: /autos
Tipo de evento: PageView
Tipo de trigger: Pageview
→ Facebook Event: PageView
```

**2.2. Usuario ve detalle de vehículo** ⭐ CLAVE PARA CATÁLOGO DINÁMICO
```
Nombre del paso: Ver Detalle de Vehículo
Ruta de la página: /autos/:id
Tipo de evento: ViewContent
Tipo de trigger: Pageview
→ Facebook Event: ViewContent (CLAVE para catálogo dinámico)
```

**2.3. Usuario hace clic en "Financiamientos"**
```
Nombre del paso: Click Financiamientos
Ruta de la página: /autos/:id
Tipo de evento: ComienzaSolicitud
Tipo de trigger: Button Click
Selector (texto del botón): Financiamientos
→ Facebook Event: InitiateCheckout (indica intención de compra)
```

**Paso 3: Activar el Journey**
- Revisar resumen
- Crear Journey (se crea en estado BORRADOR)
- Hacer clic en "Activar" para comenzar rastreo automático

**Paso 4: Verificar eventos**
Los eventos se envían automáticamente a:
- ✓ Facebook Events Manager
- ✓ Google Tag Manager
- ✓ Supabase (tabla `tracking_events`)

#### Sección 4: Eventos Disponibles
Tabla visual con todos los eventos estándar y su mapeo a Facebook:

| Evento | Mapeo Facebook Pixel |
|--------|---------------------|
| PageView | PageView |
| ViewContent | ViewContent (catálogo) |
| InitialRegistration | CompleteRegistration |
| ConversionLandingPage | Lead (desde landing) |
| ComienzaSolicitud | InitiateCheckout |
| ApplicationSubmission | SubmitApplication |
| LeadComplete | Lead (completo) |
| PersonalInformationComplete | CompleteRegistration |

#### Sección 5: Tipos de Trigger
Explicación de cada tipo disponible:
- **Pageview**: Se activa al visitar una página
- **Button Click**: Al hacer clic en botón específico
- **Form Submit**: Al enviar un formulario
- **Custom**: Disparador personalizado

#### Sección 6: Mejores Prácticas
Consejos para optimizar el uso:
- ✓ Usar ViewContent para productos (crucial para Dynamic Ads)
- ✓ Definir pasos en orden lógico
- ✓ Usar nombres descriptivos
- ✓ Probar antes de activar
- ✓ Monitorear regularmente

#### Sección 7: Solución de Problemas
Ayuda para problemas comunes:
- Eventos no aparecen en Facebook
- Trigger de botón no funciona
- Verificación con Facebook Pixel Helper

### 2. Integración en CustomerJourneysPage

**Archivo modificado**: `src/pages/CustomerJourneysPage.tsx`

**Cambios realizados**:
```typescript
// Línea 24: Import del componente guía
import CustomerJourneysGuide from '../components/CustomerJourneysGuide';

// Línea 612: Renderizado de la guía
<CustomerJourneysGuide />
```

La guía aparece:
- ✅ Al principio de la página
- ✅ Antes de los journeys existentes
- ✅ Con opción de ocultar/mostrar

### 3. Sistema de Custom Events (Base técnica)

Se crearon las bases para eventos personalizados (documentado en `CUSTOM_EVENTS_ENHANCEMENT_SUMMARY.md`):

#### Archivos creados:
- ✅ `src/services/CustomEventsService.ts` - Servicio completo de gestión
- ✅ `supabase/migrations/20251121000001_create_custom_events_table.sql` - Base de datos

#### Características del servicio:
- 9 tipos de triggers avanzados
- 5 métodos de selección de elementos
- Mapeo automático a eventos de Facebook
- Validación de selectores CSS
- Matching de patrones de URL con wildcards

## Cómo Usar la Guía

### 1. Acceder a la guía
```
Dashboard → Marketing Tools → Customer Journeys
```

La guía aparecerá automáticamente en la parte superior con un diseño llamativo.

### 2. Navegar por las secciones
- Haz clic en cualquier sección para expandir/contraer
- Las secciones importantes están abiertas por defecto
- Usa el botón "Ocultar" para minimizar la guía

### 3. Seguir el ejemplo práctico
La guía incluye un ejemplo paso a paso completo para:
- Rastrear visitas al catálogo de autos
- Detectar cuando ven detalles de vehículos (ViewContent)
- Medir clics en botón "Financiamientos"

### 4. Aplicar los conceptos
Usa los conceptos aprendidos para:
- Crear tus propios journeys personalizados
- Optimizar campañas de Facebook con datos reales
- Identificar puntos de mejora en el embudo

## Ejemplo de Uso Real: Catálogo de Facebook

### Problema que resuelve:
Necesitas saber qué vehículos específicos generan más interés para:
- Optimizar tus campañas de Facebook Dynamic Ads
- Saber qué inventario promocionar más
- Entender el comportamiento de navegación de usuarios

### Solución con Customer Journeys:

1. **Creas el journey** siguiendo la guía
2. **Facebook recibe eventos ViewContent** cada vez que alguien ve un vehículo
3. **Facebook optimiza** tus anuncios de catálogo mostrando vehículos similares
4. **Mides conversión** desde la primera vista hasta la solicitud de financiamiento

### Datos que obtendrás:

```sql
-- Ver vehículos más vistos (ViewContent events)
SELECT
  metadata->>'vehicleId' as vehicle_id,
  metadata->>'vehicleName' as vehicle_name,
  COUNT(*) as views,
  COUNT(DISTINCT user_id) as unique_viewers
FROM tracking_events
WHERE event_type = 'ViewContent'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY vehicle_id, vehicle_name
ORDER BY views DESC
LIMIT 10;
```

## Verificación de Implementación

### Checklist de verificación:

- [x] Guía visible en Customer Journeys page
- [x] Secciones colapsables funcionando
- [x] Ejemplo del catálogo de Facebook incluido
- [x] Botón ocultar/mostrar funcional
- [x] Todos los textos en español
- [x] Build exitoso (27.62s)
- [x] Diseño responsive
- [x] Iconos lucide renderizando correctamente

### Próximos pasos (opcionales):

1. **Aplicar la migración** para habilitar custom events:
```bash
./scripts/apply-migration.sh supabase/migrations/20251121000001_create_custom_events_table.sql
```

2. **Crear tu primer journey** siguiendo la guía
3. **Verificar eventos** en Facebook Events Manager
4. **Optimizar** basado en los datos recolectados

## Archivos Modificados/Creados

### Nuevos archivos:
```
✅ src/components/CustomerJourneysGuide.tsx (475 líneas)
✅ src/services/CustomEventsService.ts (270 líneas)
✅ supabase/migrations/20251121000001_create_custom_events_table.sql
✅ CUSTOM_EVENTS_ENHANCEMENT_SUMMARY.md
✅ GUIA_CUSTOMER_JOURNEYS_IMPLEMENTACION.md (este archivo)
```

### Archivos modificados:
```
✅ src/pages/CustomerJourneysPage.tsx (2 líneas agregadas)
```

## Beneficios Inmediatos

### Para el equipo de marketing:
1. **Guía clara** en español sin necesidad de documentación externa
2. **Ejemplo práctico** del caso de uso más importante (catálogo FB)
3. **Auto-servicio** - pueden crear journeys sin ayuda técnica

### Para Facebook Ads:
1. **ViewContent events** automáticos para Dynamic Product Ads
2. **Optimización de catálogo** basada en interés real
3. **Retargeting preciso** de usuarios interesados en vehículos específicos

### Para análisis:
1. **Datos granulares** de comportamiento de usuario
2. **Identificación de drop-off** en cada paso del funnel
3. **Métricas de conversión** desde vista hasta solicitud

## Soporte y Recursos

### Dentro de la aplicación:
- Guía interactiva en Customer Journeys page
- Ejemplos paso a paso
- Solución de problemas integrada

### Documentación técnica:
- `CUSTOM_EVENTS_ENHANCEMENT_SUMMARY.md` - Implementación técnica completa
- `CUSTOMER_JOURNEYS_SETUP.md` - Setup original
- Este archivo - Guía de uso en español

### Herramientas de verificación:
- Facebook Pixel Helper (Chrome extension)
- Facebook Events Manager
- GTM Preview Mode
- Browser DevTools Console

## Conclusión

✅ **Implementación completada y funcional**

La guía interactiva en español está lista para usar y proporciona todo lo necesario para:
- Entender qué son los Customer Journeys
- Crear el primer journey siguiendo el ejemplo del catálogo
- Rastrear interés en vehículos específicos
- Optimizar campañas de Facebook con datos reales
- Resolver problemas comunes

**Build exitoso**: 27.62s
**Próximo paso**: Crear tu primer Customer Journey usando la guía

---

*Última actualización: 21 de noviembre de 2025*
