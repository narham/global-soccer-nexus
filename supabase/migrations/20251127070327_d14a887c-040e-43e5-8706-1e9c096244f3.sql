-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-logos', 
  'club-logos', 
  true, 
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS policies for club logos
CREATE POLICY "Anyone can view club logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');

CREATE POLICY "Authenticated users can upload club logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'club-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update club logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'club-logos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete club logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'club-logos'
  AND auth.role() = 'authenticated'
);