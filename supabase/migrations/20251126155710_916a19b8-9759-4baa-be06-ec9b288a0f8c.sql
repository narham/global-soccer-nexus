-- Create table for competition player registrations
CREATE TABLE public.competition_player_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
  shirt_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  registered_by UUID,
  registered_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, player_id)
);

-- Enable RLS
ALTER TABLE public.competition_player_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view registrations"
ON public.competition_player_registrations FOR SELECT
USING (true);

CREATE POLICY "Club admin can register players"
ON public.competition_player_registrations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_klub'
    AND club_id = competition_player_registrations.club_id
  )
);

CREATE POLICY "Club admin can update pending registrations"
ON public.competition_player_registrations FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin_klub'
    AND club_id = competition_player_registrations.club_id
  ) AND status = 'pending')
  OR has_role(auth.uid(), 'admin_federasi')
);

CREATE POLICY "Admin federasi can manage all registrations"
ON public.competition_player_registrations FOR ALL
USING (has_role(auth.uid(), 'admin_federasi'));

-- Create trigger for updated_at
CREATE TRIGGER update_competition_player_registrations_updated_at
BEFORE UPDATE ON public.competition_player_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();