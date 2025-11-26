-- Create player_documents table
CREATE TABLE IF NOT EXISTS public.player_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  valid_from DATE,
  valid_until DATE,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create storage bucket for player documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('player-documents', 'player-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on player_documents
ALTER TABLE public.player_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_documents
CREATE POLICY "Club admin can upload documents for their players"
ON public.player_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN players p ON p.id = player_documents.player_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin_klub'
    AND ur.club_id = p.current_club_id
  )
);

CREATE POLICY "Club admin can view documents for their players"
ON public.player_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN players p ON p.id = player_documents.player_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin_klub'
    AND ur.club_id = p.current_club_id
  ) OR has_role(auth.uid(), 'admin_federasi')
);

CREATE POLICY "Admin federasi can manage all player documents"
ON public.player_documents FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Club admin can update unverified documents"
ON public.player_documents FOR UPDATE
USING (
  verified = false AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN players p ON p.id = player_documents.player_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin_klub'
    AND ur.club_id = p.current_club_id
  )
);

-- Storage policies for player-documents bucket
CREATE POLICY "Club admin can upload player documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_klub'
  )
);

CREATE POLICY "Club admin and admin federasi can view player documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'player-documents' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin_klub', 'admin_federasi')
    )
  )
);

CREATE POLICY "Admin federasi can delete player documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'player-documents' AND
  has_role(auth.uid(), 'admin_federasi')
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_player_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.role_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_documents;

-- Create trigger for updated_at
CREATE TRIGGER update_player_documents_updated_at
BEFORE UPDATE ON public.player_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();