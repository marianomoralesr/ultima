-- Fix RLS policy for roadmap_items to allow INSERT operations

-- Drop the existing policy
DROP POLICY IF EXISTS "Admin users can manage all roadmap items" ON public.roadmap_items;

-- Create new policy with both USING and WITH CHECK
CREATE POLICY "Admin users can manage all roadmap items"
    ON public.roadmap_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
