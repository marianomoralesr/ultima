-- ============================================================================
-- ADD BUTTON IDENTIFIER FIELDS TO JOURNEY STEPS
-- ============================================================================
-- Purpose: Add support for button click tracking with various identifier types
-- - button_identifier_type: how to identify the button (text, id, class, selector)
-- - button_identifier: the actual value to match against
-- Also expand trigger_type options to include more event types
-- ============================================================================

-- Update trigger_type CHECK constraint to include new types
ALTER TABLE public.journey_steps
DROP CONSTRAINT IF EXISTS journey_steps_trigger_type_check;

ALTER TABLE public.journey_steps
ADD CONSTRAINT journey_steps_trigger_type_check
CHECK (trigger_type IN (
  'pageview',
  'button_click',
  'form_submit',
  'custom',
  'scroll',
  'time_on_page',
  'element_visible',
  'video_play'
));

-- Add button identifier columns
ALTER TABLE public.journey_steps
ADD COLUMN IF NOT EXISTS button_identifier_type TEXT
CHECK (button_identifier_type IN ('text_contains', 'css_id', 'css_class', 'css_selector'));

ALTER TABLE public.journey_steps
ADD COLUMN IF NOT EXISTS button_identifier TEXT;

-- Create index for button identifier lookups
CREATE INDEX IF NOT EXISTS idx_journey_steps_button_identifier
ON public.journey_steps(button_identifier_type, button_identifier)
WHERE button_identifier IS NOT NULL;

-- Add comment explaining the new fields
COMMENT ON COLUMN public.journey_steps.button_identifier_type IS
'Type of button identifier: text_contains (button text contains value), css_id (CSS ID), css_class (CSS class), css_selector (full CSS selector)';

COMMENT ON COLUMN public.journey_steps.button_identifier IS
'Value to match against for button identification (e.g., "Comprar con Financiamiento", "btn-whatsapp", "cta-button", "button[data-action=submit]")';

-- Update trigger_type comment
COMMENT ON COLUMN public.journey_steps.trigger_type IS
'Type of trigger: pageview (page load), button_click (button/link click), form_submit (form submission), element_visible (element becomes visible), scroll (scroll depth), time_on_page (time threshold), video_play (video starts), custom (custom event)';
