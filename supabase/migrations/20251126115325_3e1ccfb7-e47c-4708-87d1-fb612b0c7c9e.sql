-- Add registration approval columns to players table
ALTER TABLE public.players
ADD COLUMN registration_status TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN registered_by UUID REFERENCES auth.users(id),
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Add index for better query performance
CREATE INDEX idx_players_registration_status ON public.players(registration_status);
CREATE INDEX idx_players_registered_by ON public.players(registered_by);

-- Add check constraint for valid registration statuses
ALTER TABLE public.players
ADD CONSTRAINT valid_registration_status 
CHECK (registration_status IN ('pending', 'approved', 'rejected'));

-- Update RLS policies for players table
DROP POLICY IF EXISTS "Club admin can manage their players" ON public.players;

-- Admin Klub can view approved players from their club OR players they registered
CREATE POLICY "Club admin can view their club's approved players or their registrations"
ON public.players
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_klub'
      AND (
        (user_roles.club_id = players.current_club_id AND players.registration_status = 'approved')
        OR players.registered_by = auth.uid()
      )
  )
);

-- Admin Klub can insert players (will be set as pending by default in the app)
CREATE POLICY "Club admin can register players"
ON public.players
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_klub'
      AND user_roles.club_id = players.current_club_id
  )
);

-- Admin Klub can update their registered players (only if still pending or rejected)
CREATE POLICY "Club admin can update their pending/rejected registrations"
ON public.players
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_klub'
      AND players.registered_by = auth.uid()
      AND players.registration_status IN ('pending', 'rejected')
  )
);

-- Admin Federasi can update any player including registration status
CREATE POLICY "Admin federasi can update players and registration status"
ON public.players
FOR UPDATE
USING (has_role(auth.uid(), 'admin_federasi'));

-- Add comment for documentation
COMMENT ON COLUMN public.players.registration_status IS 'Status of player registration: pending (waiting approval), approved (can play), rejected (needs revision)';
COMMENT ON COLUMN public.players.registered_by IS 'User ID of the admin who registered this player';
COMMENT ON COLUMN public.players.reviewed_by IS 'User ID of the admin federasi who reviewed the registration';
COMMENT ON COLUMN public.players.reviewed_at IS 'Timestamp when the registration was reviewed';
COMMENT ON COLUMN public.players.rejection_reason IS 'Reason for rejection if registration_status is rejected';