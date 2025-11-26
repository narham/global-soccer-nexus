-- Add approval workflow columns to competitions table
ALTER TABLE competitions 
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN approval_status TEXT DEFAULT 'approved' NOT NULL,
ADD COLUMN approved_by UUID,
ADD COLUMN approved_at TIMESTAMPTZ,
ADD COLUMN rejection_reason TEXT;

-- Update existing competitions to be approved
UPDATE competitions SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Create index for better query performance
CREATE INDEX idx_competitions_created_by ON competitions(created_by);
CREATE INDEX idx_competitions_approval_status ON competitions(approval_status);

-- Update RLS policies for competitions
DROP POLICY IF EXISTS "Panitia can manage competitions" ON competitions;
DROP POLICY IF EXISTS "Panitia can create competitions" ON competitions;

-- Panitia can create new competitions (pending approval)
CREATE POLICY "Panitia can create competitions"
ON competitions FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'panitia'::app_role)
);

-- Panitia can update their own pending/rejected competitions
CREATE POLICY "Panitia can update own pending competitions"
ON competitions FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'panitia'::app_role)
  AND created_by = auth.uid()
  AND approval_status IN ('pending', 'rejected')
);

-- Panitia can view their own competitions
CREATE POLICY "Panitia can view own competitions"
ON competitions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'panitia'::app_role)
  AND created_by = auth.uid()
);

-- Admin federasi can view pending competitions for approval
CREATE POLICY "Admin federasi can view all for approval"
ON competitions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin_federasi'::app_role)
);

-- Update matches RLS for Panitia
CREATE POLICY "Panitia can manage matches in approved competitions"
ON matches FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'panitia'::app_role)
  AND EXISTS (
    SELECT 1 FROM competitions 
    WHERE competitions.id = matches.competition_id
    AND competitions.created_by = auth.uid()
    AND competitions.approval_status = 'approved'
  )
);