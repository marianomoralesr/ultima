# ⚡ INSTRUCCIONES RÁPIDAS - Activar Emails en 3 Pasos

## 🎯 Objetivo
Activar el sistema de emails para que se envíen automáticamente cuando cambies el status de una aplicación.

---

## 📋 **PASO 1: Habilitar pg_net** (1 minuto)

1. Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/database/extensions
2. Busca **`pg_net`** en la lista
3. Haz clic en el botón **"Enable"**
4. Espera 10 segundos a que se active

✅ **¿Por qué?** Esta extensión permite que la base de datos haga llamadas HTTP a tus Edge Functions.

---

## 📋 **PASO 2: Ejecutar SQL en 4 Partes** (5 minutos)

Ve a: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

### **PARTE 1** - Copiar y pegar esto, luego clic en "Run":

```sql
DROP TRIGGER IF EXISTS on_application_status_change ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_status_change ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_application_submitted ON public.financing_applications CASCADE;
DROP TRIGGER IF EXISTS trigger_document_status_change ON public.uploaded_documents CASCADE;
```

Espera a que diga **"Success"**

---

### **PARTE 2** - Copiar y pegar esto, luego clic en "Run":

```sql
DROP FUNCTION IF EXISTS handle_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_application_status_change() CASCADE;
DROP FUNCTION IF EXISTS notify_application_submitted() CASCADE;
DROP FUNCTION IF EXISTS notify_document_status_change() CASCADE;
```

Espera a que diga **"Success"**

---

### **PARTE 3** - Copiar y pegar esto, luego clic en "Run":

```sql
CREATE OR REPLACE FUNCTION handle_status_change_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supabase_url text := 'https://jjepfehmuybpctdzipnu.supabase.co';
  v_notifiable_statuses text[] := ARRAY['Faltan Documentos', 'Completa', 'En Revisión', 'Aprobada', 'Rechazada'];
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = ANY(v_notifiable_statuses) THEN
      BEGIN
        PERFORM net.http_post(
          url := v_supabase_url || '/functions/v1/brevo-status-change-emails',
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object('record', to_jsonb(NEW), 'old_record', to_jsonb(OLD))
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error enviando email: %', SQLERRM;
      END;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error en trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;
```

Espera a que diga **"Success"**

---

### **PARTE 4** - Copiar y pegar esto, luego clic en "Run":

```sql
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();
```

Espera a que diga **"Success"**

---

## 📋 **PASO 3: Verificar que Funcionó** (1 minuto)

Ejecuta este SQL para verificar:

```sql
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_financing_application_status_change';
```

**Deberías ver:**
```
trigger_name: on_financing_application_status_change
table_name: financing_applications
```

---

## 🧪 **PRUEBA FINAL**

1. Ve a tu admin dashboard
2. Abre cualquier aplicación
3. Cambia el status a **"Faltan Documentos"**
4. Guarda
5. **Revisa el email del usuario** - debería llegar en 1-2 minutos

---

## 📧 **Emails que se Enviarán**

Cuando cambies el status a:

- **"Faltan Documentos"** → Email con lista de documentos + liga a dropzone
- **"Completa"** → Email de confirmación
- **"En Revisión"** → Email de actualización
- **"Aprobada"** → Email de felicitaciones 🎉
- **"Rechazada"** → Email con opciones alternativas

---

## ❌ **Si Algo Sale Mal**

### Error: "function net.http_post does not exist"
**Solución:** Habilita la extensión `pg_net` (ver Paso 1)

### Error: "timeout"
**Solución:** Ejecuta el SQL en partes como se indica arriba

### No llega el email
**Checklist:**
1. ✅ Verifica que pg_net está habilitado
2. ✅ Verifica que el trigger existe (ejecuta SQL de verificación)
3. ✅ Ve a: Dashboard → Edge Functions → brevo-status-change-emails → Logs
4. ✅ Busca errores en los logs

---

## 🎯 **Resumen Ultra Rápido**

1. Habilitar `pg_net` en Extensions
2. Ejecutar 4 bloques de SQL (en orden)
3. Verificar con SQL de verificación
4. Probar cambiando status de una aplicación

**Tiempo total: 7 minutos**

---

## ✅ **API Keys - Ya Tienes Todo**

NO necesitas configurar nada más. Ya tienes:

- ✅ `BREVO_API_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

**Es todo lo que se necesita.**

---

¿Listo? ¡Adelante! 🚀
