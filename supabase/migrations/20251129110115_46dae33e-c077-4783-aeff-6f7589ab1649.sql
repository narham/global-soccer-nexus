-- Add foreign key constraint for owner_club_id in stadiums table
ALTER TABLE stadiums
ADD CONSTRAINT stadiums_owner_club_id_fkey 
FOREIGN KEY (owner_club_id) REFERENCES clubs(id) ON DELETE SET NULL;