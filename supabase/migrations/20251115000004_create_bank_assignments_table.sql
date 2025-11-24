-- Create bank_assignments table to track which leads are assigned to which bank representatives
-- This table connects leads/applications with bank reps and tracks the status of each assignment

CREATE TABLE IF NOT EXISTS bank_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  application_id UUID,
  assigned_bank_rep_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bank_rep_notes TEXT,
  feedback TEXT,

  -- Foreign key constraints
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_application FOREIGN KEY (application_id) REFERENCES financing_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_bank_rep FOREIGN KEY (assigned_bank_rep_id) REFERENCES bank_representative_profiles(id) ON DELETE CASCADE,

  -- Check constraint for valid status values
  CONSTRAINT valid_status CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'feedback_provided'))
);

-- Create indexes for better query performance
CREATE INDEX idx_bank_assignments_lead_id ON bank_assignments(lead_id);
CREATE INDEX idx_bank_assignments_application_id ON bank_assignments(application_id);
CREATE INDEX idx_bank_assignments_bank_rep_id ON bank_assignments(assigned_bank_rep_id);
CREATE INDEX idx_bank_assignments_status ON bank_assignments(status);
CREATE INDEX idx_bank_assignments_assigned_at ON bank_assignments(assigned_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bank_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_assignments_updated_at
  BEFORE UPDATE ON bank_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_assignments_updated_at();

-- Enable RLS
ALTER TABLE bank_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_assignments

-- Admin policies (full access)
CREATE POLICY "Allow admins to view all bank assignments"
ON bank_assignments
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

CREATE POLICY "Allow admins to insert bank assignments"
ON bank_assignments
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

CREATE POLICY "Allow admins to update bank assignments"
ON bank_assignments
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

CREATE POLICY "Allow admins to delete bank assignments"
ON bank_assignments
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

-- Bank rep policies (own assignments only)
CREATE POLICY "Allow bank reps to view own assignments"
ON bank_assignments
FOR SELECT
TO authenticated
USING (assigned_bank_rep_id = auth.uid());

CREATE POLICY "Allow bank reps to update own assignments"
ON bank_assignments
FOR UPDATE
TO authenticated
USING (assigned_bank_rep_id = auth.uid())
WITH CHECK (assigned_bank_rep_id = auth.uid());

-- Add comment
COMMENT ON TABLE bank_assignments IS 'Tracks which leads/applications are assigned to which bank representatives with status and notes';
