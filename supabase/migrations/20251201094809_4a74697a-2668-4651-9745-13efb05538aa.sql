-- Create function to automatically update match scores based on goal events
CREATE OR REPLACE FUNCTION update_match_score()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
  home_goals INTEGER;
  away_goals INTEGER;
BEGIN
  -- Get match details
  SELECT home_club_id, away_club_id INTO match_record 
  FROM matches WHERE id = COALESCE(NEW.match_id, OLD.match_id);
  
  -- Calculate home goals (regular goals + penalties + opponent own goals)
  SELECT COALESCE(SUM(
    CASE 
      WHEN (event_type = 'goal' OR event_type = 'penalty_scored') AND club_id = match_record.home_club_id THEN 1
      WHEN event_type = 'own_goal' AND club_id = match_record.away_club_id THEN 1
      ELSE 0
    END
  ), 0) INTO home_goals
  FROM match_events 
  WHERE match_id = COALESCE(NEW.match_id, OLD.match_id);
  
  -- Calculate away goals (regular goals + penalties + opponent own goals)
  SELECT COALESCE(SUM(
    CASE 
      WHEN (event_type = 'goal' OR event_type = 'penalty_scored') AND club_id = match_record.away_club_id THEN 1
      WHEN event_type = 'own_goal' AND club_id = match_record.home_club_id THEN 1
      ELSE 0
    END
  ), 0) INTO away_goals
  FROM match_events 
  WHERE match_id = COALESCE(NEW.match_id, OLD.match_id);
  
  -- Update match score
  UPDATE matches 
  SET home_score = home_goals, away_score = away_goals
  WHERE id = COALESCE(NEW.match_id, OLD.match_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on match_events table
DROP TRIGGER IF EXISTS on_match_event_change ON match_events;
CREATE TRIGGER on_match_event_change
  AFTER INSERT OR UPDATE OR DELETE ON match_events
  FOR EACH ROW EXECUTE FUNCTION update_match_score();

-- Fix existing match scores based on current events
WITH goal_counts AS (
  SELECT 
    m.id as match_id,
    COALESCE(SUM(
      CASE 
        WHEN (me.event_type = 'goal' OR me.event_type = 'penalty_scored') AND me.club_id = m.home_club_id THEN 1
        WHEN me.event_type = 'own_goal' AND me.club_id = m.away_club_id THEN 1
        ELSE 0
      END
    ), 0) as home_goals,
    COALESCE(SUM(
      CASE 
        WHEN (me.event_type = 'goal' OR me.event_type = 'penalty_scored') AND me.club_id = m.away_club_id THEN 1
        WHEN me.event_type = 'own_goal' AND me.club_id = m.home_club_id THEN 1
        ELSE 0
      END
    ), 0) as away_goals
  FROM matches m
  LEFT JOIN match_events me ON me.match_id = m.id
  GROUP BY m.id
)
UPDATE matches m
SET home_score = gc.home_goals, away_score = gc.away_goals
FROM goal_counts gc
WHERE m.id = gc.match_id;