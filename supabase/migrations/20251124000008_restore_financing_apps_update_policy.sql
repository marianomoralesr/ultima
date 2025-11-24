-- Restore the UPDATE policy for financing_applications that was accidentally dropped
-- This allows users to update their own draft applications

DROP POLICY IF EXISTS "financing_apps_upd" ON public.financing_applications;

CREATE POLICY "financing_apps_upd"
ON public.financing_applications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
