
-- Trigger to notify all users when match status changes (kick off, half time, full time, extra time, penalty)
CREATE OR REPLACE FUNCTION public.trg_notify_match_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  home_name text;
  away_name text;
  status_label text;
  notif_title text;
  notif_desc text;
  score_text text;
BEGIN
  -- Only fire when status actually changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get club names
  SELECT name INTO home_name FROM public.clubs WHERE id = NEW.home_club_id;
  SELECT name INTO away_name FROM public.clubs WHERE id = NEW.away_club_id;

  score_text := COALESCE(NEW.home_score, 0)::text || ' - ' || COALESCE(NEW.away_score, 0)::text;

  -- Map status to label
  CASE NEW.status::text
    WHEN 'first_half' THEN
      notif_title := '⚽ Kick Off!';
      notif_desc := COALESCE(home_name, '') || ' vs ' || COALESCE(away_name, '') || ' — Babak 1 dimulai';
    WHEN 'half_time' THEN
      notif_title := '☕ Istirahat (HT)';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Babak 1 selesai';
    WHEN 'second_half' THEN
      notif_title := '⚽ Babak 2 Dimulai';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Kick off babak 2';
    WHEN 'extra_first_half' THEN
      notif_title := '⏱️ Extra Time Dimulai';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Perpanjangan waktu babak 1';
    WHEN 'extra_half_time' THEN
      notif_title := '☕ Istirahat ET';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Istirahat perpanjangan waktu';
    WHEN 'extra_second_half' THEN
      notif_title := '⏱️ ET Babak 2 Dimulai';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Perpanjangan waktu babak 2';
    WHEN 'penalty_shootout' THEN
      notif_title := '🎯 Adu Penalti!';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Adu penalti dimulai';
    WHEN 'finished' THEN
      notif_title := '🏁 Pertandingan Selesai';
      notif_desc := COALESCE(home_name, '') || ' ' || score_text || ' ' || COALESCE(away_name, '') || ' — Full Time';
    ELSE
      RETURN NEW;
  END CASE;

  -- Notify admin_federasi
  PERFORM notify_users_by_role(
    'admin_federasi',
    'match_status',
    notif_title,
    notif_desc,
    '/matches/' || NEW.id,
    jsonb_build_object('match_id', NEW.id, 'status', NEW.status::text)
  );

  -- Notify panitia (competition creator)
  DECLARE
    comp_creator uuid;
  BEGIN
    SELECT created_by INTO comp_creator FROM public.competitions WHERE id = NEW.competition_id;
    IF comp_creator IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, description, link, data)
      VALUES (comp_creator, 'match_status', notif_title, notif_desc, '/matches/' || NEW.id,
        jsonb_build_object('match_id', NEW.id, 'status', NEW.status::text));
    END IF;
  END;

  RETURN NEW;
END;
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_match_status_change_notify ON public.matches;
CREATE TRIGGER trg_match_status_change_notify
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_match_status_change();
