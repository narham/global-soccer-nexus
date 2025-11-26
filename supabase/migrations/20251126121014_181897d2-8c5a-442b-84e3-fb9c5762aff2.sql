-- Create match_lineups table for managing team lineups
CREATE TABLE IF NOT EXISTS public.match_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL CHECK (position_type IN ('starting', 'bench')),
  position TEXT NOT NULL,
  shirt_number INTEGER NOT NULL,
  formation_position INTEGER,
  rating DECIMAL(3,1),
  minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create match_statistics table for detailed match stats
CREATE TABLE IF NOT EXISTS public.match_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  possession INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_target INTEGER DEFAULT 0,
  passes INTEGER DEFAULT 0,
  pass_accuracy INTEGER DEFAULT 0,
  tackles INTEGER DEFAULT 0,
  fouls INTEGER DEFAULT 0,
  corners INTEGER DEFAULT 0,
  offsides INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  crosses INTEGER DEFAULT 0,
  clearances INTEGER DEFAULT 0,
  interceptions INTEGER DEFAULT 0,
  duels_won INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add additional columns to matches table
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS half_time_home_score INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS half_time_away_score INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS assistant_referee_1 TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS assistant_referee_2 TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS fourth_official TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS var_official TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS weather_condition TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS pitch_condition TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_notes TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_match_lineups_match_id ON public.match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_club_id ON public.match_lineups(club_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_player_id ON public.match_lineups(player_id);
CREATE INDEX IF NOT EXISTS idx_match_statistics_match_id ON public.match_statistics(match_id);
CREATE INDEX IF NOT EXISTS idx_match_statistics_club_id ON public.match_statistics(club_id);

-- Enable Row Level Security
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for match_lineups
CREATE POLICY "Anyone can view match lineups"
  ON public.match_lineups
  FOR SELECT
  USING (true);

CREATE POLICY "Admin federasi can manage match lineups"
  ON public.match_lineups
  FOR ALL
  USING (has_role(auth.uid(), 'admin_federasi'::app_role));

CREATE POLICY "Panitia can manage match lineups"
  ON public.match_lineups
  FOR ALL
  USING (has_role(auth.uid(), 'panitia'::app_role));

-- RLS Policies for match_statistics
CREATE POLICY "Anyone can view match statistics"
  ON public.match_statistics
  FOR SELECT
  USING (true);

CREATE POLICY "Admin federasi can manage match statistics"
  ON public.match_statistics
  FOR ALL
  USING (has_role(auth.uid(), 'admin_federasi'::app_role));

CREATE POLICY "Panitia can manage match statistics"
  ON public.match_statistics
  FOR ALL
  USING (has_role(auth.uid(), 'panitia'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_match_lineups_updated_at
  BEFORE UPDATE ON public.match_lineups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_statistics_updated_at
  BEFORE UPDATE ON public.match_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add player_out_id column to match_events for substitutions
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS player_out_id UUID REFERENCES public.players(id);
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS goal_type TEXT;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS var_decision_type TEXT;
ALTER TABLE public.match_events ADD COLUMN IF NOT EXISTS red_card_reason TEXT;