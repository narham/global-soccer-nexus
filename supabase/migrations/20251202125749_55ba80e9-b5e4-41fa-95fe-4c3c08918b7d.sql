-- Add unique constraint on player_statistics if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_statistics_player_competition_unique'
  ) THEN
    ALTER TABLE player_statistics ADD CONSTRAINT player_statistics_player_competition_unique 
    UNIQUE (player_id, competition_id);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Function to regenerate player statistics for a specific competition
CREATE OR REPLACE FUNCTION regenerate_player_statistics(comp_id UUID)
RETURNS void AS $$
DECLARE
  comp_season TEXT;
BEGIN
  -- Get competition season
  SELECT season INTO comp_season FROM competitions WHERE id = comp_id;
  
  -- Delete existing statistics for this competition
  DELETE FROM player_statistics WHERE competition_id = comp_id;
  
  -- Insert calculated statistics from match events
  INSERT INTO player_statistics (player_id, competition_id, season, goals, assists, yellow_cards, red_cards, matches_played)
  SELECT 
    player_id,
    comp_id,
    comp_season,
    SUM(CASE WHEN event_type IN ('goal', 'penalty_scored') THEN 1 ELSE 0 END) as goals,
    0 as assists, -- assists need separate tracking
    SUM(CASE WHEN event_type = 'yellow_card' THEN 1 ELSE 0 END) as yellow_cards,
    SUM(CASE WHEN event_type IN ('red_card', 'second_yellow') THEN 1 ELSE 0 END) as red_cards,
    COUNT(DISTINCT match_id) as matches_played
  FROM match_events me
  JOIN matches m ON m.id = me.match_id
  WHERE m.competition_id = comp_id
    AND me.player_id IS NOT NULL
    AND me.event_type IN ('goal', 'penalty_scored', 'yellow_card', 'red_card', 'second_yellow')
  GROUP BY me.player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to auto-update player statistics when events change
CREATE OR REPLACE FUNCTION on_match_event_change_update_stats()
RETURNS TRIGGER AS $$
DECLARE
  comp_id UUID;
BEGIN
  -- Get competition_id from match
  SELECT m.competition_id INTO comp_id 
  FROM matches m 
  WHERE m.id = COALESCE(NEW.match_id, OLD.match_id);
  
  -- Regenerate statistics for this competition
  IF comp_id IS NOT NULL THEN
    PERFORM regenerate_player_statistics(comp_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_match_event_update_player_stats ON match_events;

CREATE TRIGGER on_match_event_update_player_stats
  AFTER INSERT OR UPDATE OR DELETE ON match_events
  FOR EACH ROW
  EXECUTE FUNCTION on_match_event_change_update_stats();

-- Regenerate player statistics for all competitions with events
DO $$
DECLARE
  comp_record RECORD;
BEGIN
  FOR comp_record IN 
    SELECT DISTINCT m.competition_id 
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    WHERE me.player_id IS NOT NULL
  LOOP
    PERFORM regenerate_player_statistics(comp_record.competition_id);
  END LOOP;
END $$;