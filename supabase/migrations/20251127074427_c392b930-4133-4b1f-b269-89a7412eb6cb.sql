-- ============================================================================
-- SECURITY FIX: Protect NIK, Staff Contact Info, and Transfer Financial Data
-- ============================================================================

-- 1. DROP overly permissive public SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view players" ON public.players;
DROP POLICY IF EXISTS "Anyone can view club staff" ON public.club_staff;
DROP POLICY IF EXISTS "Anyone can view transfers" ON public.player_transfers;

-- 2. CREATE SECURE PUBLIC VIEWS (without sensitive data)
-- ============================================================================

-- Public view for players (excludes NIK data)
CREATE OR REPLACE VIEW public.players_public AS
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
  -- EXCLUDED: nik, nik_province, nik_city, nik_district
FROM public.players
WHERE registration_status = 'approved';

-- Public view for club staff (excludes contact info)
CREATE OR REPLACE VIEW public.club_staff_public AS
SELECT 
  id,
  club_id,
  name,
  role,
  joined_date,
  created_at,
  updated_at
  -- EXCLUDED: email, phone
FROM public.club_staff;

-- Public view for transfers (excludes financial data)
CREATE OR REPLACE VIEW public.player_transfers_public AS
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
  -- EXCLUDED: transfer_fee, notes, approved_by, itc_approved_by, rejected_reason
  -- EXCLUDED: from_club_approved_by, from_club_approved_at
  -- EXCLUDED: to_club_approved_by, to_club_approved_at
FROM public.player_transfers;

-- 3. CREATE NEW RESTRICTIVE RLS POLICIES
-- ============================================================================

-- PLAYERS: Restricted access to full data including NIK
CREATE POLICY "Admin federasi can view all player data"
ON public.players
FOR SELECT
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Club admin can view their players full data"
ON public.players
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin_klub'
      AND club_id = players.current_club_id
  )
  OR players.registered_by = auth.uid()
);

-- CLUB STAFF: Restricted access to full data including contact info
CREATE POLICY "Admin federasi can view all staff data"
ON public.club_staff
FOR SELECT
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Club admin can view their staff full data"
ON public.club_staff
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin_klub'
      AND club_id = club_staff.club_id
  )
);

-- PLAYER TRANSFERS: Restricted access to full data including financial info
CREATE POLICY "Admin federasi can view all transfer data"
ON public.player_transfers
FOR SELECT
USING (has_role(auth.uid(), 'admin_federasi'));

CREATE POLICY "Club admin can view their transfers full data"
ON public.player_transfers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin_klub'
      AND (club_id = player_transfers.from_club_id OR club_id = player_transfers.to_club_id)
  )
);

-- 4. GRANT PUBLIC ACCESS TO SECURE VIEWS
-- ============================================================================

GRANT SELECT ON public.players_public TO anon, authenticated;
GRANT SELECT ON public.club_staff_public TO anon, authenticated;
GRANT SELECT ON public.player_transfers_public TO anon, authenticated;