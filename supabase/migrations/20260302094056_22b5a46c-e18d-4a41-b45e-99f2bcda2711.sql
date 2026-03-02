
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications  
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Service role / triggers can insert (using security definer functions)
-- No direct INSERT policy needed for users

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Helper function to create notifications for users by role
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_users_by_role(
  _role app_role,
  _type text,
  _title text,
  _description text,
  _link text DEFAULT NULL,
  _data jsonb DEFAULT '{}'::jsonb,
  _club_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, description, link, data)
  SELECT ur.user_id, _type, _title, _description, _link, _data
  FROM public.user_roles ur
  WHERE ur.role = _role
    AND (_club_id IS NULL OR ur.club_id = _club_id);
END;
$$;

-- ============================================================
-- Trigger: New competition pending approval -> notify admin_federasi
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_competition_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status = 'pending' THEN
    PERFORM notify_users_by_role(
      'admin_federasi',
      'competition',
      'Kompetisi Baru Menunggu Approval',
      NEW.name || ' perlu disetujui',
      '/competitions/' || NEW.id,
      jsonb_build_object('competition_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_competition_pending
  AFTER INSERT ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_competition_pending();

-- ============================================================
-- Trigger: Competition approved/rejected -> notify panitia (creator)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_competition_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.approval_status = 'pending' AND NEW.approval_status = 'approved' AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, description, link, data)
    VALUES (NEW.created_by, 'competition', 'Kompetisi Disetujui', NEW.name || ' telah disetujui', '/competitions/' || NEW.id, jsonb_build_object('competition_id', NEW.id));
  ELSIF OLD.approval_status = 'pending' AND NEW.approval_status = 'rejected' AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, description, link, data)
    VALUES (NEW.created_by, 'competition', 'Kompetisi Ditolak', NEW.name || ' ditolak: ' || COALESCE(NEW.rejection_reason, '-'), '/competitions/' || NEW.id, jsonb_build_object('competition_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_competition_status_change
  AFTER UPDATE OF approval_status ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_competition_status_change();

-- ============================================================
-- Trigger: New player pending -> notify admin_federasi
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_player_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.registration_status = 'pending' THEN
    PERFORM notify_users_by_role(
      'admin_federasi',
      'player',
      'Pemain Baru Menunggu Verifikasi',
      NEW.full_name || ' perlu diverifikasi',
      '/players/' || NEW.id,
      jsonb_build_object('player_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_player_pending
  AFTER INSERT ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_player_pending();

-- ============================================================
-- Trigger: Player approved/rejected -> notify admin_klub of that club
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_player_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.registration_status = 'pending' AND NEW.registration_status = 'approved' AND NEW.current_club_id IS NOT NULL THEN
    PERFORM notify_users_by_role(
      'admin_klub',
      'player',
      'Pemain Disetujui',
      NEW.full_name || ' telah diverifikasi',
      '/players/' || NEW.id,
      jsonb_build_object('player_id', NEW.id),
      NEW.current_club_id
    );
  ELSIF OLD.registration_status = 'pending' AND NEW.registration_status = 'rejected' AND NEW.current_club_id IS NOT NULL THEN
    PERFORM notify_users_by_role(
      'admin_klub',
      'player',
      'Pemain Ditolak',
      NEW.full_name || ' ditolak: ' || COALESCE(NEW.rejection_reason, '-'),
      '/players/' || NEW.id,
      jsonb_build_object('player_id', NEW.id),
      NEW.current_club_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_player_status_change
  AFTER UPDATE OF registration_status ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_player_status_change();

-- ============================================================
-- Trigger: Transfer status changes -> notify relevant parties
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_transfer_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  player_name text;
BEGIN
  SELECT full_name INTO player_name FROM public.players WHERE id = NEW.player_id;

  IF TG_OP = 'INSERT' THEN
    -- New transfer -> notify admin_federasi
    PERFORM notify_users_by_role(
      'admin_federasi', 'transfer', 'Transfer Baru Diajukan',
      'Transfer ' || COALESCE(player_name, 'pemain') || ' perlu ditinjau',
      '/transfers/' || NEW.id,
      jsonb_build_object('transfer_id', NEW.id)
    );
    -- Notify destination club
    IF NEW.to_club_id IS NOT NULL THEN
      PERFORM notify_users_by_role('admin_klub', 'transfer', 'Transfer Masuk Baru',
        COALESCE(player_name, 'Pemain') || ' diajukan transfer ke klub Anda',
        '/transfers/' || NEW.id, jsonb_build_object('transfer_id', NEW.id), NEW.to_club_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      -- Notify both clubs
      IF NEW.from_club_id IS NOT NULL THEN
        PERFORM notify_users_by_role('admin_klub', 'transfer', 'Transfer Disetujui',
          'Transfer ' || COALESCE(player_name, 'pemain') || ' telah disetujui',
          '/transfers/' || NEW.id, jsonb_build_object('transfer_id', NEW.id), NEW.from_club_id);
      END IF;
      IF NEW.to_club_id IS NOT NULL THEN
        PERFORM notify_users_by_role('admin_klub', 'transfer', 'Transfer Disetujui',
          'Transfer ' || COALESCE(player_name, 'pemain') || ' telah disetujui',
          '/transfers/' || NEW.id, jsonb_build_object('transfer_id', NEW.id), NEW.to_club_id);
      END IF;
    ELSIF NEW.status = 'rejected' THEN
      IF NEW.from_club_id IS NOT NULL THEN
        PERFORM notify_users_by_role('admin_klub', 'transfer', 'Transfer Ditolak',
          'Transfer ' || COALESCE(player_name, 'pemain') || ' ditolak',
          '/transfers/' || NEW.id, jsonb_build_object('transfer_id', NEW.id), NEW.from_club_id);
      END IF;
      IF NEW.to_club_id IS NOT NULL THEN
        PERFORM notify_users_by_role('admin_klub', 'transfer', 'Transfer Ditolak',
          'Transfer ' || COALESCE(player_name, 'pemain') || ' ditolak',
          '/transfers/' || NEW.id, jsonb_build_object('transfer_id', NEW.id), NEW.to_club_id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transfer_change
  AFTER INSERT OR UPDATE OF status ON public.player_transfers
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_transfer_change();

-- ============================================================
-- Trigger: Role request status change -> notify user
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_role_request_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM notify_users_by_role('admin_federasi', 'role_request', 'Permintaan Role Baru',
      'Ada permintaan role ' || NEW.requested_role || ' yang perlu direview',
      '/users', jsonb_build_object('request_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, description, link, data)
    VALUES (NEW.user_id, 'role_request',
      CASE WHEN NEW.status = 'approved' THEN 'Permintaan Role Disetujui' ELSE 'Permintaan Role Ditolak' END,
      'Permintaan role ' || NEW.requested_role || CASE WHEN NEW.status = 'approved' THEN ' telah disetujui' ELSE ' ditolak' END,
      '/profile',
      jsonb_build_object('request_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_role_request_change
  AFTER INSERT OR UPDATE OF status ON public.role_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_role_request_change();

-- ============================================================
-- Trigger: Match assignment -> notify wasit
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_match_official()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_user_id uuid;
  match_info record;
BEGIN
  SELECT user_id INTO ref_user_id FROM public.referees WHERE id = NEW.referee_id;
  IF ref_user_id IS NOT NULL THEN
    SELECT m.match_date, hc.name as home_name, ac.name as away_name INTO match_info
    FROM public.matches m
    JOIN public.clubs hc ON hc.id = m.home_club_id
    JOIN public.clubs ac ON ac.id = m.away_club_id
    WHERE m.id = NEW.match_id;
    
    INSERT INTO public.notifications (user_id, type, title, description, link, data)
    VALUES (ref_user_id, 'match_assignment', 'Penugasan Pertandingan Baru',
      'Anda ditugaskan sebagai ' || NEW.role || ' untuk ' || COALESCE(match_info.home_name, '') || ' vs ' || COALESCE(match_info.away_name, ''),
      '/matches/' || NEW.match_id,
      jsonb_build_object('match_id', NEW.match_id, 'role', NEW.role));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_match_official_assigned
  AFTER INSERT ON public.match_officials
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_match_official();

-- ============================================================
-- Trigger: Player registration in competition -> notify admin_federasi + panitia
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_notify_player_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  player_name text;
  comp_creator uuid;
BEGIN
  SELECT full_name INTO player_name FROM public.players WHERE id = NEW.player_id;
  
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM notify_users_by_role('admin_federasi', 'player_registration', 'Registrasi Pemain Kompetisi',
      COALESCE(player_name, 'Pemain') || ' didaftarkan ke kompetisi',
      '/competitions/' || NEW.competition_id,
      jsonb_build_object('registration_id', NEW.id, 'competition_id', NEW.competition_id));
    
    -- Notify panitia (competition creator)
    SELECT created_by INTO comp_creator FROM public.competitions WHERE id = NEW.competition_id;
    IF comp_creator IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, description, link, data)
      VALUES (comp_creator, 'player_registration', 'Registrasi Pemain Baru',
        COALESCE(player_name, 'Pemain') || ' didaftarkan ke kompetisi Anda',
        '/competitions/' || NEW.competition_id,
        jsonb_build_object('registration_id', NEW.id, 'competition_id', NEW.competition_id));
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Notify the club admin
    PERFORM notify_users_by_role('admin_klub', 'player_registration',
      CASE WHEN NEW.status = 'approved' THEN 'Registrasi Pemain Disetujui' ELSE 'Registrasi Pemain Ditolak' END,
      COALESCE(player_name, 'Pemain') || CASE WHEN NEW.status = 'approved' THEN ' diterima di kompetisi' ELSE ' ditolak dari kompetisi' END,
      '/clubs/' || NEW.club_id || '/competitions',
      jsonb_build_object('registration_id', NEW.id, 'competition_id', NEW.competition_id),
      NEW.club_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_player_registration
  AFTER INSERT OR UPDATE OF status ON public.competition_player_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_player_registration();
