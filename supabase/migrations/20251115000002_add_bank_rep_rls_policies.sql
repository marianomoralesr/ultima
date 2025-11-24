-- Add RLS policies for bank_representative_profiles table
-- This allows admins to manage bank representatives and bank reps to view their own profile

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admins to view all bank representatives" ON bank_representative_profiles;
DROP POLICY IF EXISTS "Allow admins to update bank representatives" ON bank_representative_profiles;
DROP POLICY IF EXISTS "Allow admins to insert bank representatives" ON bank_representative_profiles;
DROP POLICY IF EXISTS "Allow admins to delete bank representatives" ON bank_representative_profiles;
DROP POLICY IF EXISTS "Allow bank reps to view own profile" ON bank_representative_profiles;
DROP POLICY IF EXISTS "Allow bank reps to update own profile" ON bank_representative_profiles;
DROP POLICY IF EXISTS "Allow users to create own bank rep profile" ON bank_representative_profiles;

-- Admin policies (full access)
CREATE POLICY "Allow admins to view all bank representatives"
ON bank_representative_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  )
);

CREATE POLICY "Allow admins to update bank representatives"
ON bank_representative_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  )
);

CREATE POLICY "Allow admins to insert bank representatives"
ON bank_representative_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  )
);

CREATE POLICY "Allow admins to delete bank representatives"
ON bank_representative_profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email IN (
      'mariano.morales@autostrefa.mx',
      'fernando.trevino@autostrefa.mx',
      'lizeth.juarez@autostrefa.mx',
      'alejandro.trevino@autostrefa.mx',
      'alejandro.gallardo@autostrefa.mx',
      'hola@autostrefa.mx',
      'evelia.castillo@autostrefa.mx'
    )
  )
);

-- Bank rep policies (own profile only)
CREATE POLICY "Allow bank reps to view own profile"
ON bank_representative_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Allow bank reps to update own profile"
ON bank_representative_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to create their own bank rep profile during registration
CREATE POLICY "Allow users to create own bank rep profile"
ON bank_representative_profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Add comment
COMMENT ON TABLE bank_representative_profiles IS 'Bank representative profiles with RLS policies for admin management and self-service';
