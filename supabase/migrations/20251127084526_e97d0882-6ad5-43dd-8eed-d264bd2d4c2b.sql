-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('player-documents', 'player-documents', true),
  ('club-documents', 'club-documents', true),
  ('competition-documents', 'competition-documents', true);

-- RLS Policies for player-documents bucket
CREATE POLICY "Anyone can view player documents"
ON storage.objects FOR SELECT 
USING (bucket_id = 'player-documents');

CREATE POLICY "Authenticated can upload player documents"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'player-documents' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete player documents"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'player-documents' AND 
  (has_role(auth.uid(), 'admin_klub'::app_role) OR has_role(auth.uid(), 'admin_federasi'::app_role))
);

-- RLS Policies for club-documents bucket
CREATE POLICY "Anyone can view club documents"
ON storage.objects FOR SELECT 
USING (bucket_id = 'club-documents');

CREATE POLICY "Authenticated can upload club documents"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'club-documents' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can delete club documents"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'club-documents' AND 
  (has_role(auth.uid(), 'admin_klub'::app_role) OR has_role(auth.uid(), 'admin_federasi'::app_role))
);

-- RLS Policies for competition-documents bucket
CREATE POLICY "Anyone can view competition documents"
ON storage.objects FOR SELECT 
USING (bucket_id = 'competition-documents');

CREATE POLICY "Panitia can upload competition documents"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'competition-documents' AND 
  (has_role(auth.uid(), 'panitia'::app_role) OR has_role(auth.uid(), 'admin_federasi'::app_role))
);

CREATE POLICY "Panitia can delete their competition documents"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'competition-documents' AND 
  (has_role(auth.uid(), 'panitia'::app_role) OR has_role(auth.uid(), 'admin_federasi'::app_role))
);

-- Create competition_documents table
CREATE TABLE IF NOT EXISTS public.competition_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  valid_from DATE,
  valid_until DATE,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on competition_documents
ALTER TABLE public.competition_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competition_documents
CREATE POLICY "Anyone can view competition documents"
ON public.competition_documents FOR SELECT 
USING (true);

CREATE POLICY "Panitia can insert documents for their competitions"
ON public.competition_documents FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'panitia'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.competitions
    WHERE id = competition_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Admin federasi can manage all competition documents"
ON public.competition_documents FOR ALL 
USING (has_role(auth.uid(), 'admin_federasi'::app_role));

CREATE POLICY "Panitia can update their competition documents"
ON public.competition_documents FOR UPDATE 
USING (
  has_role(auth.uid(), 'panitia'::app_role) AND
  uploaded_by = auth.uid() AND
  verified = false
);

-- Create trigger for updated_at
CREATE TRIGGER update_competition_documents_updated_at
BEFORE UPDATE ON public.competition_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();