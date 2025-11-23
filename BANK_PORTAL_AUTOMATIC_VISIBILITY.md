# Portal Bancario - Visibilidad Automática de Solicitudes

## Resumen

Esta actualización habilita la **visibilidad automática** de solicitudes en el portal bancario basándose en el campo `selected_banks` de la tabla `financing_applications`. Los bancos ahora verán automáticamente las solicitudes donde fueron recomendados por el sistema, sin necesidad de asignación manual por parte de los agentes de ventas.

## Cambios Realizados

### 1. Migración de Base de Datos
**Archivo**: `supabase/migrations/20251123000001_update_bank_rep_filtering_by_selected_banks.sql`

La migración actualiza tres funciones de PostgreSQL para filtrar solicitudes basándose en la afiliación del representante bancario:

#### Funciones Actualizadas:

1. **`get_bank_rep_assigned_leads(bank_rep_uuid UUID)`**
   - Ahora retorna solicitudes donde el `bank_affiliation` del representante está en el array `selected_banks`
   - Filtra por estado de solicitud: `submitted`, `reviewing`, `approved`, o `rejected`
   - Incluye conteo de documentos y seguimiento de tiempo
   - Se une con `bank_assignments` para asignaciones explícitas (mantiene compatibilidad hacia atrás)

2. **`get_bank_rep_dashboard_stats(bank_rep_uuid UUID)`**
   - Calcula estadísticas basadas en solicitudes en el array `selected_banks`
   - Cuenta: total asignadas, pendientes de revisión, aprobadas, rechazadas, con retroalimentación
   - Usa la afiliación del representante bancario para filtrar resultados

3. **`get_bank_rep_lead_details(p_bank_rep_id UUID, p_lead_id UUID)`**
   - Retorna datos detallados de solicitudes visibles para el banco
   - Verifica que la afiliación bancaria esté en `selected_banks` antes de mostrar datos
   - Retorna solicitud completa, documentos e información de asignación

### 2. Actualizaciones de Frontend

#### BankLeadProfilePage.tsx
- Se agregó importación del componente `PrintableApplication`
- Muestra detalles completos de la solicitud en formato imprimible
- Presenta información completa de financiamiento a los representantes bancarios

### 3. Cómo Funciona

```
Flujo de Solicitud:
1. Usuario completa solicitud de financiamiento
2. Sistema analiza perfil del usuario y recomienda bancos
3. Bancos recomendados se almacenan en el campo array `selected_banks`
4. Representantes bancarios ven automáticamente solicitudes donde su banco fue recomendado
5. No se necesita asignación manual (pero sigue siendo compatible para casos especiales)
```

## Aplicar la Migración

### Opción 1: Usando el Dashboard de Supabase (Recomendado)

1. Ve al dashboard de tu proyecto Supabase
2. Navega al **Editor SQL**
3. Abre el archivo de migración:
   ```
   supabase/migrations/20251123000001_update_bank_rep_filtering_by_selected_banks.sql
   ```
4. Copia todo el contenido SQL
5. Pega en el Editor SQL
6. Haz clic en **Run** para ejecutar

### Opción 2: Usando Supabase CLI

Si tienes un estado de migración limpio:

```bash
supabase db push
```

### Opción 3: Conexión Directa a PostgreSQL

Si otros métodos fallan, puedes aplicar manualmente vía psql:

```bash
# Conecta a tu base de datos
psql -h <tu-host-supabase> -U postgres -d postgres

# Luego pega el SQL del archivo de migración
\i supabase/migrations/20251123000001_update_bank_rep_filtering_by_selected_banks.sql
```

## Probar los Cambios

### 1. Verificar que Existen las Funciones

Ejecuta esta consulta en el Editor SQL de Supabase:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_bank_rep_assigned_leads',
    'get_bank_rep_dashboard_stats',
    'get_bank_rep_lead_details'
  );
```

Resultado esperado: 3 funciones de tipo 'FUNCTION'

### 2. Probar Vista del Representante Bancario

1. Inicia sesión como representante bancario
2. Ve al dashboard bancario en `/bancos/dashboard`
3. Verifica que veas solicitudes donde tu banco está en el array `selected_banks`
4. Verifica que las estadísticas del dashboard se muestren correctamente

### 3. Probar Detalles de Solicitud

1. Haz clic en cualquier solicitud en el dashboard bancario
2. Verifica que puedas ver:
   - Información completa del cliente
   - Detalles del vehículo
   - Vista imprimible de la solicitud
   - Todos los documentos subidos
   - Estado de asignación

### 4. Probar Visibilidad Automática

Crea un escenario de prueba:

```sql
-- 1. Crear una solicitud de prueba con bancos seleccionados
INSERT INTO financing_applications (
  user_id,
  status,
  selected_banks,
  car_info
) VALUES (
  '<uuid-usuario-prueba>',
  'submitted',
  ARRAY['scotiabank', 'bbva']::text[],
  '{"vehicleTitle": "Vehículo de Prueba", "price": 300000}'::jsonb
);

-- 2. Inicia sesión como representante de Scotiabank y verifica que aparezca la solicitud
-- 3. Inicia sesión como representante de BBVA y verifica que aparezca la solicitud
-- 4. Inicia sesión como representante de Banregio y verifica que NO aparezca la solicitud
```

## Beneficios Clave

1. **Visibilidad Automática**: Los bancos ven inmediatamente solicitudes relevantes sin asignación manual
2. **Reducción de Trabajo Manual**: El equipo de ventas no necesita asignar manualmente cada solicitud
3. **Mejor Emparejamiento**: Los bancos solo ven solicitudes donde fueron recomendados según el perfil del usuario
4. **Compatible Hacia Atrás**: Las asignaciones manuales existentes en la tabla `bank_assignments` siguen funcionando
5. **Flujo Mejorado**: Tiempo de procesamiento más rápido desde la presentación de solicitud hasta la revisión bancaria

## Referencia del Esquema de Base de Datos

### Tabla `financing_applications`
- **`selected_banks`**: Campo array `text[]`
- Contiene IDs de bancos (ej., `['scotiabank', 'bbva', 'banregio']`)
- Se llena automáticamente por el flujo de aplicación basándose en el análisis del perfil del usuario

### Tabla `bank_representative_profiles`
- **`bank_affiliation`**: Campo `text`
- Contiene un solo ID de banco (ej., `'scotiabank'`)
- Se usa para filtrar qué solicitudes puede ver cada representante bancario

### IDs de Bancos (Tipo BankName)
Valores válidos:
- `'scotiabank'`
- `'bbva'`
- `'banregio'`
- `'banorte'`
- `'afirme'`
- `'hey_banco'`
- `'ban_bajio'`
- `'santander'`
- `'hsbc'`

## Consideraciones de Seguridad

- Todas las funciones RPC usan `SECURITY DEFINER` para asegurar autorización apropiada
- Las funciones verifican que el llamador sea:
  1. El representante bancario mismo (`auth.uid() = bank_rep_uuid`)
  2. Un usuario administrador (verificado contra lista de emails de admin)
- Se verifica la afiliación bancaria antes de mostrar cualquier dato
- Solo son visibles solicitudes con estado `submitted`, `reviewing`, `approved`, o `rejected`

## Resolución de Problemas

### Las Solicitudes No Aparecen

1. **Verificar array `selected_banks`**:
   ```sql
   SELECT id, status, selected_banks
   FROM financing_applications
   WHERE status IN ('submitted', 'reviewing', 'approved', 'rejected');
   ```

2. **Verificar afiliación del representante bancario**:
   ```sql
   SELECT id, email, bank_affiliation
   FROM bank_representative_profiles
   WHERE id = '<uuid-rep-bancario>';
   ```

3. **Verificar si la afiliación coincide**:
   ```sql
   SELECT fa.id, fa.selected_banks, brp.bank_affiliation
   FROM financing_applications fa
   CROSS JOIN bank_representative_profiles brp
   WHERE brp.id = '<uuid-rep-bancario>'
     AND brp.bank_affiliation = ANY(fa.selected_banks);
   ```

### Las Estadísticas del Dashboard Muestran Cero

- Asegúrate de que la migración se aplicó exitosamente
- Verifica que las funciones tengan los permisos adecuados:
  ```sql
  SELECT grantee, privilege_type
  FROM information_schema.routine_privileges
  WHERE routine_name = 'get_bank_rep_assigned_leads';
  ```

### Errores de Permisos

- Verifica que el perfil del representante bancario existe:
  ```sql
  SELECT * FROM bank_representative_profiles WHERE id = '<uuid-rep-bancario>';
  ```
- Verifica que el perfil esté aprobado: `is_approved = true`
- Asegúrate de que el usuario esté autenticado

## Próximos Pasos

Después de aplicar esta migración:

1. ✅ Probar con una cuenta de representante bancario
2. ✅ Verificar que la visibilidad automática funciona
3. ✅ Confirmar que los documentos son accesibles
4. ✅ Probar la vista imprimible de la solicitud
5. ✅ Monitorear errores en el portal bancario

## Archivos Modificados

### Backend (Base de Datos)
- `supabase/migrations/20251123000001_update_bank_rep_filtering_by_selected_banks.sql` (NUEVO)

### Frontend
- `src/pages/BankLeadProfilePage.tsx` (MODIFICADO)
  - Agregado componente `PrintableApplication` para vista completa de solicitud

### Componentes Existentes Utilizados
- `src/components/PrintableApplication.tsx` (Ya existía, no modificado)

## Soporte

Si encuentras problemas:
1. Revisa los logs de Supabase para errores de funciones
2. Verifica que la migración se aplicó exitosamente
3. Revisa las políticas RLS en las tablas relevantes
4. Contacta al equipo de desarrollo con mensajes de error específicos

---

**Migración Creada**: 23 de Noviembre, 2025
**Última Actualización**: 23 de Noviembre, 2025
**Estado**: Lista para Aplicar
