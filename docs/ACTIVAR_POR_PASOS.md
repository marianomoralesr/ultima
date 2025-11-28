# 🔧 ACTIVAR EMAILS - PASO A PASO (Sin Timeout)

Ejecuta **UN SQL A LA VEZ** en el SQL Editor. Espera que cada uno complete antes de continuar.

SQL Editor: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql/new

---

## PASO 1: Verificar triggers existentes

```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgrelid::regclass::text = 'financing_applications';
```

Anota cuáles existen. Si ves alguno con "email" o "status", continúa.

---

## PASO 2: Eliminar SOLO el trigger que vamos a crear (rápido)

```sql
DROP TRIGGER IF EXISTS on_financing_application_status_change ON public.financing_applications;
```

Debería ser instantáneo. Si da timeout aquí, **DETENTE** y avísame.

---

## PASO 3: Crear la función (sin trigger todavía)

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
        NULL;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
```

Debería ser rápido (1-2 segundos).

---

## PASO 4: Crear el trigger

```sql
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_status_change_email();
```

Si esto da timeout, es porque hay muchas filas en `financing_applications` o hay locks.

---

## ❌ SI PASO 4 DA TIMEOUT:

Intenta con un trigger más específico que solo se active en cambios de status:

```sql
CREATE TRIGGER on_financing_application_status_change
  AFTER UPDATE OF status ON public.financing_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_status_change_email();
```

---

## 🔍 DIAGNÓSTICO: Si TODO da timeout

Ejecuta esto para ver si hay locks:

```sql
SELECT
  pid,
  state,
  query,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE datname = 'postgres'
  AND state != 'idle'
ORDER BY query_start DESC
LIMIT 10;
```

---

## ⚡ SOLUCIÓN ALTERNATIVA: Usar un trigger más simple

Si nada funciona, intenta crear un trigger que NO use net.http_post, solo para probar:

```sql
CREATE OR REPLACE FUNCTION test_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE NOTICE 'Status changed from % to %', OLD.status, NEW.status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS test_status_change ON public.financing_applications;

CREATE TRIGGER test_status_change
  AFTER UPDATE OF status ON public.financing_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION test_trigger();
```

Si esto funciona sin timeout, entonces el problema no es el trigger sino algo más.

---

## 🆘 ÚLTIMA OPCIÓN: Edge Function sin Trigger

Si TODO da timeout, podemos llamar a la Edge Function directamente desde tu frontend cuando cambies el status, sin usar triggers de base de datos.

Avísame en qué paso te quedas.
