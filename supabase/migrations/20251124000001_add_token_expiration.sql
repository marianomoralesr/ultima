-- Agregar campo de expiración de tokens
-- Los tokens expiran en 3 días después de ser creados

ALTER TABLE public.financing_applications
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Actualizar trigger para incluir fecha de expiración (3 días)
CREATE OR REPLACE FUNCTION set_public_upload_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo generar token si no existe uno
  IF NEW.public_upload_token IS NULL THEN
    NEW.public_upload_token := generate_public_upload_token();
    NEW.token_expires_at := NOW() + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Actualizar aplicaciones existentes con fecha de expiración (3 días desde ahora)
UPDATE public.financing_applications
SET token_expires_at = NOW() + INTERVAL '3 days'
WHERE public_upload_token IS NOT NULL
  AND token_expires_at IS NULL;

-- Función para regenerar token (usada por admin/sales)
CREATE OR REPLACE FUNCTION regenerate_public_upload_token(application_id_param UUID)
RETURNS TABLE(new_token TEXT, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token_value TEXT;
  new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generar nuevo token
  new_token_value := generate_public_upload_token();
  new_expires_at := NOW() + INTERVAL '3 days';

  -- Actualizar aplicación
  UPDATE public.financing_applications
  SET
    public_upload_token = new_token_value,
    token_expires_at = new_expires_at,
    updated_at = NOW()
  WHERE id = application_id_param;

  -- Retornar el nuevo token y fecha de expiración
  RETURN QUERY SELECT new_token_value, new_expires_at;
END;
$$;

-- Agregar índice para búsquedas por expiración
CREATE INDEX IF NOT EXISTS idx_financing_applications_token_expires_at
ON public.financing_applications(token_expires_at)
WHERE public_upload_token IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN public.financing_applications.token_expires_at IS
'Fecha y hora de expiración del token público (3 días desde creación)';

COMMENT ON FUNCTION regenerate_public_upload_token IS
'Genera un nuevo token público con nueva fecha de expiración. Solo accesible por admin y sales.';
