# Configuración de Estatus de Solicitudes de Financiamiento

Este documento describe la configuración completa de los estatus de solicitudes en la plataforma TREFA, para ser utilizado en automatizaciones de correo electrónico, funciones Edge de Supabase y comunicaciones internas.

## 📊 Estatus Primarios (Usar estos en todas las operaciones)

### Estados Iniciales

#### 1. **`'draft'`** - Borrador
- **Valor exacto:** `'draft'`
- **Descripción:** La solicitud está siendo llenada por el usuario
- **Cuándo se usa:** Solicitud guardada pero no enviada
- **Color UI:** Gris (`bg-gray-100 text-gray-800`)
- **Comunicación:** No enviar notificaciones automáticas
- **Siguiente paso:** Usuario completa y envía solicitud

#### 2. **`'Faltan Documentos'`** - Documentos Faltantes
- **Valor exacto:** `'Faltan Documentos'`
- **Descripción:** Solicitud enviada pero faltan documentos requeridos
- **Cuándo se usa:** Usuario envió la solicitud sin cargar todos los documentos
- **Color UI:** Amarillo (`bg-yellow-100 text-yellow-800`)
- **Comunicación:**
  - Enviar email al usuario con link de carga de documentos
  - Incluir token público: `/documentos/{public_upload_token}`
  - Recordatorio semanal si no se suben documentos
- **Siguiente paso:** Usuario sube documentos → cambia a `'Completa'`

#### 3. **`'Completa'`** - Solicitud Completa
- **Valor exacto:** `'Completa'`
- **Descripción:** Solicitud enviada con todos los documentos requeridos
- **Cuándo se usa:** Usuario envió solicitud Y cargó todos los documentos
- **Color UI:** Verde (`bg-green-100 text-green-800`)
- **Comunicación:**
  - Enviar confirmación al usuario
  - Notificar al equipo de ventas/admin
  - Notificar al banco seleccionado
- **Siguiente paso:** Admin/Banco revisa → cambia a `'En Revisión'`

---

### Estados de Revisión

#### 4. **`'En Revisión'`** - Bajo Revisión
- **Valor exacto:** `'En Revisión'`
- **Descripción:** La solicitud está siendo revisada por el banco o administrador
- **Cuándo se usa:** Admin o banco comenzó el proceso de revisión
- **Color UI:** Púrpura (`bg-purple-100 text-purple-800`)
- **Comunicación:**
  - Enviar actualización al usuario
  - Notificaciones internas al equipo
  - Actualizaciones de progreso cada 3 días
- **Siguiente paso:** Revisión finaliza → cambia a `'Aprobada'` o `'Rechazada'`

---

### Estados Finales

#### 5. **`'Aprobada'`** - Solicitud Aprobada
- **Valor exacto:** `'Aprobada'`
- **Descripción:** La solicitud fue aprobada por el banco
- **Cuándo se usa:** Banco o admin aprueba la solicitud
- **Color UI:** Verde (`bg-green-100 text-green-800`)
- **Comunicación:**
  - Email de felicitación al usuario
  - Incluir próximos pasos (firma de contrato, entrega del vehículo)
  - Notificar al equipo de ventas para seguimiento
  - Notificar al banco para documentación final
- **Siguiente paso:** Proceso de cierre y entrega de vehículo

#### 6. **`'Rechazada'`** - Solicitud Rechazada
- **Valor exacto:** `'Rechazada'`
- **Descripción:** La solicitud fue rechazada
- **Cuándo se usa:** Banco o admin rechaza la solicitud
- **Color UI:** Rojo (`bg-red-100 text-red-800`)
- **Comunicación:**
  - Email al usuario explicando motivo (si aplica)
  - Ofrecer alternativas o recomendaciones
  - Notificar al equipo de ventas
- **Siguiente paso:** Cerrar proceso o iniciar nueva solicitud

---

## 🔄 Flujo de Transición de Estatus

```
┌─────────┐
│  draft  │ ← Usuario llenando solicitud
└────┬────┘
     │ Usuario envía sin docs completos
     ▼
┌──────────────────┐
│ Faltan Documentos│ ← Email con link de carga
└────┬────────┬────┘
     │        │ Usuario sube docs
     │        ▼
     │   ┌──────────┐
     │   │ Completa │ ← Notificar banco/admin
     │   └────┬─────┘
     │        │
     └────────┤ Admin/Banco inicia revisión
              ▼
         ┌─────────────┐
         │ En Revisión │ ← Actualizaciones periódicas
         └──────┬──────┘
                │
        ┌───────┴────────┐
        ▼                ▼
    ┌──────────┐    ┌───────────┐
    │ Aprobada │    │ Rechazada │
    └──────────┘    └───────────┘
```

---

## ⚠️ Estatus Legacy (Solo para Compatibilidad - NO USAR en Nuevas Implementaciones)

Estos estatus existen por compatibilidad con solicitudes antiguas. **NO** los uses en nuevas automatizaciones:

```typescript
'submitted'      // → Usar 'Faltan Documentos' o 'Completa'
'reviewing'      // → Usar 'En Revisión'
'pending_docs'   // → Usar 'Faltan Documentos'
'approved'       // → Usar 'Aprobada'
'in_review'      // → Usar 'En Revisión'
```

---

## 📧 Plantillas de Email por Estatus

### Email: Faltan Documentos

**Asunto:** Falta un paso para completar tu solicitud - TREFA

**Contenido:**
```
Hola {nombre_usuario},

¡Tu solicitud #{application_id_corto} ha sido recibida!

Para poder procesarla, necesitamos que subas los siguientes documentos:
- INE (ambos lados)
- Comprobante de domicilio
- Comprobantes de ingresos (últimos 3 meses)

Puedes subirlos usando este enlace:
{upload_link}

Este enlace es personal y seguro. Puedes usarlo en cualquier momento.

¿Necesitas ayuda? Contáctanos por WhatsApp: {whatsapp_link}

Saludos,
Equipo TREFA
```

### Email: Completa

**Asunto:** ¡Solicitud completa! - Siguiente paso - TREFA

**Contenido:**
```
Hola {nombre_usuario},

¡Excelente! Tu solicitud #{application_id_corto} está completa.

Ya recibimos todos tus documentos y están siendo revisados por nuestro equipo y el banco.

Próximos pasos:
1. Revisión de documentos (1-2 días hábiles)
2. Análisis crediticio por el banco (2-3 días hábiles)
3. Te contactaremos con los resultados

Puedes revisar el estatus en cualquier momento aquí:
{seguimiento_link}

¿Preguntas? Estamos aquí para ayudarte: {whatsapp_link}

Saludos,
Equipo TREFA
```

### Email: En Revisión

**Asunto:** Tu solicitud está en revisión - TREFA

**Contenido:**
```
Hola {nombre_usuario},

Tu solicitud #{application_id_corto} está siendo revisada por nuestro equipo y el banco {banco_nombre}.

Tiempo estimado de respuesta: 2-5 días hábiles

Te mantendremos informado del progreso. Mientras tanto, puedes revisar el estatus aquí:
{seguimiento_link}

Saludos,
Equipo TREFA
```

### Email: Aprobada

**Asunto:** 🎉 ¡Felicidades! Tu solicitud ha sido aprobada - TREFA

**Contenido:**
```
¡Hola {nombre_usuario}!

¡Tenemos excelentes noticias! 🎉

Tu solicitud #{application_id_corto} para el {vehiculo_nombre} ha sido APROBADA por {banco_nombre}.

Detalles del financiamiento:
- Monto aprobado: {monto_aprobado}
- Plazo: {plazo_meses} meses
- Enganche: {enganche}

Próximos pasos:
1. Nuestro equipo te contactará en las próximas 24 horas
2. Firma del contrato
3. Pago del enganche
4. ¡Entrega de tu vehículo!

¿Listo para tu nuevo auto? Contáctanos: {whatsapp_link}

¡Felicidades!
Equipo TREFA
```

### Email: Rechazada

**Asunto:** Actualización de tu solicitud - TREFA

**Contenido:**
```
Hola {nombre_usuario},

Lamentamos informarte que tu solicitud #{application_id_corto} no pudo ser aprobada en esta ocasión.

Esto puede deberse a varios factores en el análisis crediticio del banco.

¿Qué puedes hacer?
- Contáctanos para conocer opciones alternativas
- Podemos ayudarte a mejorar tu perfil crediticio
- Explora otras opciones de financiamiento

Nuestro equipo está disponible para ayudarte: {whatsapp_link}

No te rindas, hay opciones para ti.

Saludos,
Equipo TREFA
```

---

## 🔧 Implementación en Edge Functions de Supabase

### Ejemplo: Actualizar Estatus

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Cambiar a "Completa" cuando se suben todos los documentos
await supabase
  .from('financing_applications')
  .update({ status: 'Completa' })
  .eq('id', applicationId)

// Enviar notificación
await sendEmailNotification({
  to: userEmail,
  template: 'application_complete',
  data: { applicationId, userName, trackingLink }
})
```

### Ejemplo: Trigger de Base de Datos

```sql
-- Trigger para enviar emails cuando cambia el estatus
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el estatus realmente cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN

    -- Insertar en cola de emails
    INSERT INTO email_queue (
      recipient_email,
      template_name,
      template_data,
      application_id
    )
    SELECT
      p.email,
      CASE NEW.status
        WHEN 'Faltan Documentos' THEN 'missing_documents'
        WHEN 'Completa' THEN 'application_complete'
        WHEN 'En Revisión' THEN 'under_review'
        WHEN 'Aprobada' THEN 'approved'
        WHEN 'Rechazada' THEN 'rejected'
        ELSE 'status_update'
      END,
      jsonb_build_object(
        'application_id', NEW.id,
        'user_name', p.first_name,
        'status', NEW.status,
        'upload_link', CONCAT('https://trefa.mx/documentos/', NEW.public_upload_token),
        'tracking_link', CONCAT('https://trefa.mx/escritorio/seguimiento/', NEW.id)
      ),
      NEW.id
    FROM profiles p
    WHERE p.id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_change();
```

---

## 📋 Checklist de Validación

Antes de cambiar un estatus, verifica:

### Para `'Faltan Documentos'` → `'Completa'`
- ✅ Todos los documentos requeridos están cargados
- ✅ Documentos pasaron validación básica (formato, tamaño)
- ✅ INE (frente y reverso)
- ✅ Comprobante de domicilio
- ✅ Comprobantes de ingresos

### Para `'Completa'` → `'En Revisión'`
- ✅ Admin o banco asignado inició revisión
- ✅ Todos los documentos verificados
- ✅ Información de contacto del usuario verificada

### Para `'En Revisión'` → `'Aprobada'`
- ✅ Banco confirmó aprobación
- ✅ Monto y términos definidos
- ✅ Documentos finales preparados

### Para `'En Revisión'` → `'Rechazada'`
- ✅ Razón de rechazo documentada
- ✅ Notificación interna al equipo
- ✅ Email al usuario preparado

---

## 🎨 Configuración de UI

### Colores por Estatus

```typescript
const STATUS_COLORS = {
  'draft': {
    badge: 'bg-gray-100 text-gray-800',
    dot: 'bg-gray-500',
    text: 'text-gray-700',
    border: 'border-gray-300'
  },
  'Faltan Documentos': {
    badge: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-amber-600',
    text: 'text-amber-700',
    border: 'border-yellow-300'
  },
  'Completa': {
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-green-300'
  },
  'En Revisión': {
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
    text: 'text-purple-700',
    border: 'border-purple-300'
  },
  'Aprobada': {
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-green-300'
  },
  'Rechazada': {
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
    text: 'text-red-700',
    border: 'border-red-300'
  }
}
```

---

## 🚨 Reglas Importantes

### ✅ HACER
- Usar valores exactos (case-sensitive): `'Faltan Documentos'` no `'faltan documentos'`
- Registrar cambios de estatus en logs/auditoría
- Enviar notificaciones apropiadas en cada transición
- Validar condiciones antes de cambiar estatus
- Usar estatus primarios en todas las nuevas implementaciones

### ❌ NO HACER
- Usar estatus legacy en nuevas solicitudes
- Cambiar estatus sin validación previa
- Omitir notificaciones al usuario
- Usar valores personalizados no documentados
- Modificar estatus directamente sin triggers

---

## 📞 Contactos para Soporte

- **Equipo Técnico:** Implementación de automatizaciones
- **Equipo de Ventas:** Definición de flujos de comunicación
- **Banco/Financiera:** Integración y aprobaciones

---

**Última actualización:** 2025-01-27
**Versión:** 1.0
**Mantenido por:** Equipo de Desarrollo TREFA

---

## 📚 Referencias

- Archivo de constantes: `/src/constants/applicationStatus.ts`
- Servicio de aplicaciones: `/src/services/ApplicationService.ts`
- Documentación de base de datos: `/docs/database-schema.md`
- API de notificaciones: `/docs/api/notifications.md`
