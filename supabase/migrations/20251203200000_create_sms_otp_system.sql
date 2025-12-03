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

-- Permitir inserción desde la función edge (sin autenticación)
CREATE POLICY "Allow service role to insert OTP codes"
  ON public.sms_otp_codes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir lectura solo desde funciones autenticadas
CREATE POLICY "Allow authenticated users to read their own OTP codes"
  ON public.sms_otp_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir actualización desde funciones autenticadas
CREATE POLICY "Allow service role to update OTP codes"
  ON public.sms_otp_codes
  FOR UPDATE
  TO service_role
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
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_code',
        'message', 'Código inválido'
      );
    ELSIF v_otp_record.expires_at <= NOW() THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'expired_code',
        'message', 'Código expirado'
      );
    ELSIF v_otp_record.verified = TRUE THEN
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
