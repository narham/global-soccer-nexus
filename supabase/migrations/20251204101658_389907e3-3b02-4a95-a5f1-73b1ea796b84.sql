-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-logos', 'club-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view club logos
CREATE POLICY "Anyone can view club logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');

-- Allow admin federasi to upload/manage club logos
CREATE POLICY "Admin federasi can manage club logos"
ON storage.objects FOR ALL
USING (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'admin_federasi'::public.app_role))
WITH CHECK (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'admin_federasi'::public.app_role));

-- Allow club admin to upload their club logos
CREATE POLICY "Club admin can upload club logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'admin_klub'::public.app_role));

-- Migrate old transfer status from 'pending' to new workflow statuses
UPDATE player_transfers 
SET status = 'pending_club_from'
WHERE status = 'pending' AND from_club_id IS NOT NULL;

UPDATE player_transfers 
SET status = 'pending_club_to'
WHERE status = 'pending' AND from_club_id IS NULL;