-- Add last_sign_in_at column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in_at ON public.profiles(last_sign_in_at);

-- Create function to sync last_sign_in_at from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profiles table with the new last_sign_in_at value
  UPDATE public.profiles
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users to automatically sync last_sign_in_at
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.sync_last_sign_in();

-- Backfill existing last_sign_in_at data from auth.users
UPDATE public.profiles p
SET last_sign_in_at = u.last_sign_in_at
FROM auth.users u
WHERE p.id = u.id
AND u.last_sign_in_at IS NOT NULL;
