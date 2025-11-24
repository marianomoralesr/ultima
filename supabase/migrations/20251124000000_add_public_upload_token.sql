-- Agregar campo public_upload_token a financing_applications
-- Este token único permite el acceso público a un dropzone de documentos para cada aplicación

ALTER TABLE public.financing_applications
ADD COLUMN IF NOT EXISTS public_upload_token TEXT UNIQUE;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_financing_applications_public_upload_token
ON public.financing_applications(public_upload_token);

-- Función para generar un token único y seguro
CREATE OR REPLACE FUNCTION generate_public_upload_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generar un token aleatorio de 32 caracteres (UUID sin guiones + 8 caracteres extra)
    new_token := replace(gen_random_uuid()::text, '-', '') || substr(md5(random()::text), 1, 8);

    -- Verificar si el token ya existe
    SELECT EXISTS(
      SELECT 1 FROM public.financing_applications WHERE public_upload_token = new_token
    ) INTO token_exists;

    -- Si no existe, salir del loop
    EXIT WHEN NOT token_exists;
  END LOOP;

  RETURN new_token;
END;
$$;

-- Trigger para generar automáticamente el token al crear una aplicación
CREATE OR REPLACE FUNCTION set_public_upload_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo generar token si no existe uno
  IF NEW.public_upload_token IS NULL THEN
    NEW.public_upload_token := generate_public_upload_token();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger para nuevas aplicaciones
DROP TRIGGER IF EXISTS trigger_set_public_upload_token ON public.financing_applications;
CREATE TRIGGER trigger_set_public_upload_token
  BEFORE INSERT ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_public_upload_token();

-- Generar tokens para aplicaciones existentes que no tengan uno
UPDATE public.financing_applications
SET public_upload_token = generate_public_upload_token()
WHERE public_upload_token IS NULL;

-- Comentarios
COMMENT ON COLUMN public.financing_applications.public_upload_token IS
'Token único para acceso público al dropzone de documentos de esta aplicación';
