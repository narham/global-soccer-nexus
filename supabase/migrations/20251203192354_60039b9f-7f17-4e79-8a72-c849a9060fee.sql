-- Update status check constraint to support multi-step approval workflow
ALTER TABLE player_transfers 
DROP CONSTRAINT IF EXISTS player_transfers_status_check;

ALTER TABLE player_transfers 
ADD CONSTRAINT player_transfers_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'pending_club_from'::text,
  'pending_club_to'::text, 
  'pending_federation'::text,
  'club_approved'::text, 
  'awaiting_itc'::text, 
  'approved'::text, 
  'rejected'::text, 
  'cancelled'::text
]));