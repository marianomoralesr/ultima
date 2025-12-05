-- Verificar y asegurar la estructura correcta de la tabla anonymous_survey_responses
-- Esta migración es idempotente y puede ejecutarse múltiples veces sin problemas

-- Asegurar que la tabla existe con la estructura correcta
CREATE TABLE IF NOT EXISTS public.anonymous_survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  responses JSONB NOT NULL,
  coupon_code TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_responses_completed_at
  ON public.anonymous_survey_responses(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_responses_coupon_code
  ON public.anonymous_survey_responses(coupon_code);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_responses_responses
  ON public.anonymous_survey_responses USING GIN (responses);

-- Habilitar Row Level Security
ALTER TABLE public.anonymous_survey_responses ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen y recrearlas
DROP POLICY IF EXISTS "Allow anonymous survey submission" ON public.anonymous_survey_responses;
DROP POLICY IF EXISTS "Allow authenticated survey submission" ON public.anonymous_survey_responses;
DROP POLICY IF EXISTS "Allow admins to view all survey responses" ON public.anonymous_survey_responses;

-- Política para permitir inserciones anónimas (envío de encuesta)
CREATE POLICY "Allow anonymous survey submission"
  ON public.anonymous_survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para permitir inserciones autenticadas
CREATE POLICY "Allow authenticated survey submission"
  ON public.anonymous_survey_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para que admins vean todas las respuestas
CREATE POLICY "Allow admins to view all survey responses"
  ON public.anonymous_survey_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Agregar comentarios descriptivos
COMMENT ON TABLE public.anonymous_survey_responses IS 'Almacena respuestas de encuestas anónimas con códigos de cupón como incentivo';
COMMENT ON COLUMN public.anonymous_survey_responses.id IS 'Identificador único para cada respuesta de encuesta';
COMMENT ON COLUMN public.anonymous_survey_responses.responses IS 'Objeto JSONB con todas las respuestas de la encuesta (usa IDs string como "age", "nps", etc.)';
COMMENT ON COLUMN public.anonymous_survey_responses.coupon_code IS 'Código de cupón único generado para el encuestado';
COMMENT ON COLUMN public.anonymous_survey_responses.completed_at IS 'Timestamp de cuando se completó la encuesta';
COMMENT ON COLUMN public.anonymous_survey_responses.created_at IS 'Timestamp de cuando se creó el registro';
