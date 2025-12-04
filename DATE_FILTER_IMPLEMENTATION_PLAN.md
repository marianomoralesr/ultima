# Plan de Implementación de Filtros de Fecha

## ✅ Completado

### 1. Menú de Sales
- ✅ Agregados roles 'sales' a commonNavItems
- Sales ahora puede ver: Inventario, Vender mi auto, Mi Perfil, Solicitudes, Nueva solicitud

### 2. Error en /ventas/performance
- ✅ Agregada propiedad `is_complete?` al interface `ApplicationDetail`
- Resuelto el error de boundary

### 3. Componente DateRangeFilter
- ✅ Creado componente reusable en `src/components/DateRangeFilter.tsx`
- Incluye presets: Hoy, Ayer, Últimos 7/30/90 días, Este mes, Mes pasado, Este año, Todo el tiempo
- Retorna startDate y endDate para filtrar datos

## 🚧 Pendiente

### Páginas a Modificar

#### 1. AdminBusinessAnalyticsDashboard (`src/pages/AdminBusinessAnalyticsDashboard.tsx`)
**Cambios necesarios:**
- Agregar estado para dateRange
- Agregar DateRangeFilter en el header
- Modificar `loadBusinessData()` para aceptar parámetros de fecha
- Actualizar llamada a `BusinessAnalyticsService.getBusinessMetrics()` con fechas
- Filtrar datos en el frontend si el servicio no soporta filtros

**Ubicación:** Línea ~40 (loadBusinessData function)

#### 2. ApplicationAnalyticsPage (`src/pages/ApplicationAnalyticsPage.tsx`)
**Cambios necesarios:**
- Agregar estado para dateRange
- Agregar DateRangeFilter en el header
- Filtrar applications por created_at usando el rango de fechas
- Actualizar métricas basadas en datos filtrados

**Ubicación:** Verificar estructura del componente

#### 3. UnifiedCRMPage (`src/pages/UnifiedCRMPage.tsx`)
**Cambios necesarios:**
- Agregar estado para dateRange
- Agregar DateRangeFilter en el header
- Filtrar leads por created_at o updated_at
- Actualizar contadores y métricas

**Ubicación:** Verificar estructura del componente

### Servicios a Verificar

Necesitamos verificar si estos servicios soportan filtros de fecha:
- `BusinessAnalyticsService.getBusinessMetrics()`
- Cualquier RPC function o query usado en ApplicationAnalyticsPage
- Queries de CRM en UnifiedCRMPage

Si no soportan filtros de fecha, aplicaremos el filtro en el frontend.

## Estrategia de Implementación

1. Leer cada página para entender su estructura
2. Agregar importaciones necesarias
3. Agregar estado de dateRange con valor default 'allTime'
4. Insertar DateRangeFilter en el header/toolbar de cada página
5. Implementar filtrado de datos:
   - Backend: Si el servicio soporta parámetros de fecha
   - Frontend: Filtrar arrays de datos por fecha usando dateRange
6. Actualizar métricas calculadas para reflejar datos filtrados
7. Probar que los filtros funcionen correctamente

## Patrón de Implementación

```typescript
// 1. Importar
import DateRangeFilter, { DateRange } from '../components/DateRangeFilter';

// 2. Estado
const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    preset: 'allTime'
});

// 3. Función de filtrado
const filterByDateRange = (items: any[], dateField: string = 'created_at') => {
    if (!dateRange.startDate || !dateRange.endDate) {
        return items;
    }
    return items.filter(item => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= dateRange.startDate! && itemDate <= dateRange.endDate!;
    });
};

// 4. UI
<DateRangeFilter value={dateRange} onChange={setDateRange} />

// 5. Aplicar filtro a datos
const filteredData = filterByDateRange(rawData);
```

## Próximos Pasos

1. Implementar en AdminBusinessAnalyticsDashboard
2. Implementar en ApplicationAnalyticsPage
3. Implementar en UnifiedCRMPage
4. Verificar que servicios usen las últimas versiones
5. Testing de cada implementación
