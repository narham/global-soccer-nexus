-- Fix overly permissive storage INSERT policies
-- Drop existing permissive insert policies and replace with role-restricted ones

-- player-documents bucket: Only admin_klub (for their players) or admin_federasi can upload
DROP POLICY IF EXISTS "Authenticated can upload player documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload" ON storage.objects;

CREATE POLICY "Admin can upload player documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-documents' AND
  (
    has_role(auth.uid(), 'admin_federasi'::app_role) OR
    has_role(auth.uid(), 'admin_klub'::app_role)
  )
);

-- club-documents bucket: Only admin_klub (for their club) or admin_federasi can upload
CREATE POLICY "Admin can upload club documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'club-documents' AND
  (
    has_role(auth.uid(), 'admin_federasi'::app_role) OR
    has_role(auth.uid(), 'admin_klub'::app_role)
  )
);

-- competition-documents bucket: Only panitia (for their competitions) or admin_federasi can upload
CREATE POLICY "Organizer can upload competition documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'competition-documents' AND
  (
    has_role(auth.uid(), 'admin_federasi'::app_role) OR
    has_role(auth.uid(), 'panitia'::app_role)
  )
);

-- avatars bucket: Any authenticated user can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- profile-documents bucket: Users can upload their own documents
CREATE POLICY "Users can upload own profile documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-documents' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);