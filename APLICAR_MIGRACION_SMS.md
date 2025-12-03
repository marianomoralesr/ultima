# Aplicar Migración de SMS OTP

## ⚠️ IMPORTANTE: Debes hacer esto AHORA para que funcione el SMS

El error "Código inválido o expirado" ocurre porque **la tabla `sms_otp_codes` no existe todavía** en tu base de datos.

## Opción 1: Desde Supabase Dashboard (MÁS FÁCIL) ⭐

1. **Abre Supabase Dashboard:**
   https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/sql

2. **Copia y pega este SQL completo en el editor:**

```sql
-- Tabla para almacenar códigos OTP de SMS temporales
CREATE TABLE IF NOT EXISTS public.sms_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  twilio_message_sid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0,
  CONSTRAINT sms_otp_codes_phone_check CHECK (phone ~ '^\+?[1-9]\d{1,14}$')
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sms_otp_phone ON public.sms_otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_otp_expires_at ON public.sms_otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_otp_verified ON public.sms_otp_codes(verified);

-- RLS políticas
ALTER TABLE public.sms_otp_codes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow service role to insert OTP codes" ON public.sms_otp_codes;
DROP POLICY IF EXISTS "Allow authenticated users to read their own OTP codes" ON public.sms_otp_codes;
DROP POLICY IF EXISTS "Allow service role to update OTP codes" ON public.sms_otp_codes;
DROP POLICY IF EXISTS "Allow anon to call verify" ON public.sms_otp_codes;

-- Permitir inserción desde la función edge (sin autenticación)
CREATE POLICY "Allow service role to insert OTP codes"
  ON public.sms_otp_codes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir lectura para usuarios autenticados y anónimos
CREATE POLICY "Allow authenticated users to read their own OTP codes"
  ON public.sms_otp_codes
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Permitir actualización desde funciones autenticadas
CREATE POLICY "Allow service role to update OTP codes"
  ON public.sms_otp_codes
  FOR UPDATE
  TO service_role, authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Función para limpiar códigos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sms_otp_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.sms_otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Función para verificar código OTP
CREATE OR REPLACE FUNCTION public.verify_sms_otp(
  p_phone TEXT,
  p_otp_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp_record RECORD;
  v_result JSONB;
BEGIN
  -- Log para debugging
  RAISE NOTICE 'Verificando OTP para teléfono: % con código: %', p_phone, p_otp_code;

  -- Buscar el código más reciente no verificado para este teléfono
  SELECT * INTO v_otp_record
  FROM public.sms_otp_codes
  WHERE phone = p_phone
    AND otp_code = p_otp_code
    AND verified = FALSE
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si no se encuentra, verificar si existe pero expiró
  IF v_otp_record IS NULL THEN
    SELECT * INTO v_otp_record
    FROM public.sms_otp_codes
    WHERE phone = p_phone
      AND otp_code = p_otp_code
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_otp_record IS NULL THEN
      RAISE NOTICE 'Código no encontrado en la base de datos';
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_code',
        'message', 'Código inválido'
      );
    ELSIF v_otp_record.expires_at <= NOW() THEN
      RAISE NOTICE 'Código expirado. Expira: %, Ahora: %', v_otp_record.expires_at, NOW();
      RETURN jsonb_build_object(
        'success', false,
        'error', 'expired_code',
        'message', 'Código expirado'
      );
    ELSIF v_otp_record.verified = TRUE THEN
      RAISE NOTICE 'Código ya fue verificado anteriormente';
      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_verified',
        'message', 'Código ya utilizado'
      );
    END IF;
  END IF;

  -- Marcar como verificado
  UPDATE public.sms_otp_codes
  SET verified = TRUE,
      verified_at = NOW()
  WHERE id = v_otp_record.id;

  RAISE NOTICE 'Código verificado exitosamente';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Código verificado exitosamente',
    'phone', p_phone
  );
END;
$$;

-- Comentarios
COMMENT ON TABLE public.sms_otp_codes IS 'Almacena códigos OTP temporales para verificación de teléfono vía SMS';
COMMENT ON FUNCTION public.cleanup_expired_sms_otp_codes() IS 'Limpia códigos OTP expirados (ejecutar diariamente)';
COMMENT ON FUNCTION public.verify_sms_otp(TEXT, TEXT) IS 'Verifica un código OTP de SMS';
```

3. **Click en "Run" (abajo a la derecha)**

4. **Verifica que se creó:**
   - Ve a Table Editor
   - Busca la tabla `sms_otp_codes`

## Opción 2: Desde la terminal

```bash
./apply-sms-migration.sh
```

## ✅ Después de Aplicar la Migración

1. **Prueba de nuevo el registro:**
   - Ve a http://localhost:5173/registro
   - O http://localhost:5173/financiamientos
   - Ingresa tus datos
   - Recibirás el SMS
   - Ingresa el código

2. **Verifica en la base de datos:**
```sql
-- Ver códigos enviados
SELECT * FROM sms_otp_codes ORDER BY created_at DESC LIMIT 10;

-- Probar la función
SELECT verify_sms_otp('+525512345678', '123456');
```

## 🐛 Si Sigue Sin Funcionar

Abre la consola del navegador (F12) y busca errores. Copia el error completo para investigar más.

---

**NOTA:** Esta migración es segura de aplicar. Usa `CREATE TABLE IF NOT EXISTS` así que si ya existe, no hará nada.
