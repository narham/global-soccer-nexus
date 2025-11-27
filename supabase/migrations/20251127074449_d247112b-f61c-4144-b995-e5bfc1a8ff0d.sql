-- ============================================================================
-- FIX: Remove Security Definer from Views and Add RLS Policies
-- ============================================================================

-- 1. DROP existing views
-- ============================================================================
DROP VIEW IF EXISTS public.players_public;
DROP VIEW IF EXISTS public.club_staff_public;
DROP VIEW IF EXISTS public.player_transfers_public;

-- 2. RECREATE VIEWS with explicit SECURITY INVOKER
-- ============================================================================

-- Public view for players (excludes NIK data)
CREATE VIEW public.players_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  date_of_birth,
  place_of_birth,
  nationality,
  position,
  preferred_foot,
  height_cm,
  weight_kg,
  current_club_id,
  shirt_number,
  contract_start,
  contract_end,
  market_value,
  injury_status,
  transfer_status,
  registration_status,
  photo_url,
  created_at,
  updated_at
FROM public.players
WHERE registration_status = 'approved';

-- Public view for club staff (excludes contact info)
CREATE VIEW public.club_staff_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  club_id,
  name,
  role,
  joined_date,
  created_at,
  updated_at
FROM public.club_staff;

-- Public view for transfers (excludes financial data)
CREATE VIEW public.player_transfers_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  player_id,
  from_club_id,
  to_club_id,
  transfer_type,
  transfer_window_id,
  status,
  contract_start,
  contract_end,
  loan_end_date,
  requires_itc,
  itc_status,
  itc_request_date,
  itc_approved_date,
  approved_at,
  created_at,
  updated_at
FROM public.player_transfers;

-- 3. ENABLE RLS ON VIEWS
-- ============================================================================
ALTER VIEW public.players_public SET (security_invoker = true);
ALTER VIEW public.club_staff_public SET (security_invoker = true);
ALTER VIEW public.player_transfers_public SET (security_invoker = true);

-- 4. GRANT ACCESS TO VIEWS
-- ============================================================================
GRANT SELECT ON public.players_public TO anon, authenticated;
GRANT SELECT ON public.club_staff_public TO anon, authenticated;
GRANT SELECT ON public.player_transfers_public TO anon, authenticated;

-- Note: Views inherit RLS from underlying tables, so no additional policies needed on views