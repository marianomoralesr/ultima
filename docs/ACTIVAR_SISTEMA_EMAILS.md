# 🚀 CÓMO ACTIVAR EL SISTEMA DE EMAILS - Autos TREFA

## ✅ LO QUE YA ESTÁ CONFIGURADO

- ✅ **BREVO_API_KEY** - Configurado y funcionando
- ✅ **Edge Functions** - Desplegadas:
  - `brevo-status-change-emails`
  - `automated-email-notifications`
- ✅ **Templates de Email** - Modernos, amigables, con "Auto" y tono de "tú"

---

## ⚠️ LO QUE FALTA PARA ACTIVAR

### 1. **Aplicar Migración SQL** (5 minutos)

Ve a: **Supabase Dashboard → SQL Editor**
URL: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

Copia y pega este SQL:

```sql
-- ============================================================================
-- ACTIVAR SISTEMA DE EMAILS - Autos TREFA
-- ============================================================================

-- PASO 1: Limpiar triggers antiguos
DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents;

DROP FUNCTION IF EXISTS handle_application_status_change();
DROP FUNCTION IF EXISTS notify_application_status_change();
DROP FUNCTION IF EXISTS notify_application_submitted();
DROP FUNCTION IF EXISTS notify_document_status_change();

-- PASO 2: Crear función moderna de emails
CREATE OR REPLACE FUNCTION handle_status_change_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://jjepfehmuybpctdzipnu.supabase.co';
  v_notifiable_statuses text[] := ARRAY['Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada'];
BEGIN
  -- Solo procesar cuando el status cambia
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    -- Solo enviar emails para statuses específicos
    IF NEW.status = ANY(v_notifiable_statuses) THEN

      -- Prevenir duplicados (verificar última hora)
      IF NOT EXISTS (
        SELECT 1 FROM public.user_email_notifications
        WHERE user_id = NEW.user_id
        AND email_type = 'status_change_' || lower(replace(NEW.status, ' ', '_'))
        AND metadata->>'application_id' = NEW.id::text
        AND sent_at > NOW() - INTERVAL '1 hour'
      ) THEN

        -- Llamar Edge Function para enviar email
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/brevo-status-change-emails',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object(
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
          )
        );

      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- No fallar la transacción si hay error
  RAISE WARNING 'Error enviando email: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- PASO 3: Crear trigger
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();

-- ============================================================================
-- ¡LISTO! Ahora los emails se enviarán automáticamente cuando cambies el status
-- ============================================================================
```

Haz clic en **"Run"** (ejecutar)

---

### 2. **Habilitar Extensión pg_net** (1 minuto)

Ve a: **Supabase Dashboard → Database → Extensions**
URL: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/database/extensions

1. Busca `pg_net`
2. Haz clic en **"Enable"**

**¿Por qué?** Esta extensión permite que los triggers de la base de datos hagan llamadas HTTP a las Edge Functions.

---

### 3. **Configurar Cron Job para Emails Automáticos** (Opcional pero recomendado)

#### Paso 3.1: Habilitar pg_cron
Ve a: **Supabase Dashboard → Database → Extensions**

1. Busca `pg_cron`
2. Haz clic en **"Enable"**

#### Paso 3.2: Crear el Cron Job
Ve a: **Supabase Dashboard → SQL Editor**

Copia y pega:

```sql
-- Eliminar jobs antiguos si existen
SELECT cron.unschedule('automated-email-notifications');
SELECT cron.unschedule('daily-email-notifications');
SELECT cron.unschedule('daily-automated-emails');

-- Crear job que se ejecuta diariamente a las 10:00 AM (hora México)
-- UTC-6 = 16:00 UTC
SELECT cron.schedule(
  'daily-automated-emails',
  '0 16 * * *',  -- 10:00 AM hora México
  $$
  SELECT net.http_post(
    url := 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/automated-email-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar que se creó correctamente
SELECT * FROM cron.job WHERE jobname = 'daily-automated-emails';
```

Este job enviará emails automáticos a:
- Usuarios con aplicaciones incompletas (>24h)
- Usuarios con perfiles incompletos (>24h)
- Purchase leads sin contactar (>24h)
- Valuaciones pendientes

---

## 🧪 CÓMO PROBAR QUE FUNCIONA

### Prueba 1: Email de Cambio de Status

1. Ve a una aplicación de prueba en tu admin dashboard
2. Cambia el status a **"Faltan Documentos"**
3. Guarda
4. **Verifica el email llegó** a la dirección del usuario

### Prueba 2: Verificar Logs

Ve a: **Supabase Dashboard → Edge Functions → brevo-status-change-emails → Logs**

Deberías ver algo como:
```
Status change detected: draft -> Faltan Documentos for application abc123
Successfully sent Faltan Documentos email to user@email.com
```

### Prueba 3: Verificar Base de Datos

Ejecuta en SQL Editor:

```sql
-- Ver emails enviados recientemente
SELECT
  created_at,
  email_type,
  subject,
  metadata->>'application_id' as app_id
FROM user_email_notifications
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📧 EMAILS QUE SE ENVIARÁN AUTOMÁTICAMENTE

| Evento | Email |
|--------|-------|
| Status → **Faltan Documentos** | 📄 Email con lista de documentos + liga a dropzone |
| Status → **Completa** | ✅ Confirmación + timeline del proceso |
| Status → **En Revisión** | 🔍 Actualización tranquilizadora |
| Status → **Aprobada** | 🎉 ¡FELICIDADES! con próximos pasos |
| Status → **Rechazada** | 💙 Mensaje empático + opciones alternativas |
| **Perfil incompleto >24h** | ✨ Recordatorio para completar perfil |
| **Aplicación incompleta >24h** | 🚗 "Tu auto te está esperando" |

---

## ❓ TROUBLESHOOTING

### ❌ Error: "relation 'net' does not exist"
**Solución:** Habilita la extensión `pg_net` (ver Paso 2)

### ❌ No llegan emails
**Checklist:**
1. ✅ Verificar que BREVO_API_KEY está configurado: `npx supabase secrets list | grep BREVO`
2. ✅ Verificar que el trigger existe:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_financing_application_status_change';
```
3. ✅ Verificar logs de la Edge Function en Dashboard
4. ✅ Verificar que el email del usuario es válido en la tabla `profiles`

### ❌ Emails duplicados
**No debería pasar** - el sistema tiene 3 capas de prevención de duplicados. Si pasa:
```sql
-- Ver si hay duplicados en última hora
SELECT
  user_id,
  email_type,
  COUNT(*)
FROM user_email_notifications
WHERE sent_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, email_type
HAVING COUNT(*) > 1;
```

---

## 🎯 RESUMEN RÁPIDO

**Para activar TODO el sistema:**

1. **SQL Editor** → Pega el SQL del Paso 1 → Run
2. **Extensions** → Habilita `pg_net`
3. **Extensions** → Habilita `pg_cron` (opcional)
4. **SQL Editor** → Pega el SQL del Paso 3.2 → Run (opcional)
5. **Prueba** → Cambia status de una aplicación

**Tiempo total: 7 minutos**

---

## 📊 KEYS CONFIGURADOS

Ya tienes configurado:
- ✅ `BREVO_API_KEY` - Para enviar emails vía Brevo
- ✅ `SUPABASE_URL` - URL de tu proyecto
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Para acceso completo desde Edge Functions

**NO necesitas configurar nada más.**

---

## 🆘 ¿NECESITAS AYUDA?

Si algo no funciona:
1. Revisa los logs de Edge Functions en Dashboard
2. Ejecuta las queries de troubleshooting
3. Verifica que `pg_net` está habilitado
4. Revisa que el trigger existe

---

**Creado:** 27 de Noviembre, 2025
**Autor:** Claude Code
