-- Fix INSERT policy to allow club admins to create transfers when they are EITHER the from_club OR to_club
DROP POLICY IF EXISTS "Club admin can create transfers for their players" ON player_transfers;

CREATE POLICY "Club admin can create transfers"
ON player_transfers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_klub'::app_role
    AND (
      user_roles.club_id = player_transfers.from_club_id
      OR user_roles.club_id = player_transfers.to_club_id
    )
  )
);