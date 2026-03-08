-- Add extra time and penalty shootout status values
ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'extra_first_half';
ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'extra_half_time';
ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'extra_second_half';
ALTER TYPE public.match_status ADD VALUE IF NOT EXISTS 'penalty_shootout';

-- Add columns for extra time and penalty scores
ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS extra_time_home_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS extra_time_away_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS penalty_home_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS penalty_away_score integer DEFAULT NULL;