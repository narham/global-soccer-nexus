-- Function to regenerate standings for a specific competition
CREATE OR REPLACE FUNCTION regenerate_competition_standings(comp_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete existing standings for this competition
  DELETE FROM standings WHERE competition_id = comp_id;
  
  -- Insert calculated standings from match results
  INSERT INTO standings (competition_id, club_id, group_name, played, won, drawn, lost, 
                         goals_for, goals_against, goal_difference, points, position)
  SELECT 
    competition_id,
    club_id,
    group_name,
    COUNT(*) as played,
    SUM(CASE WHEN scored > conceded THEN 1 ELSE 0 END) as won,
    SUM(CASE WHEN scored = conceded THEN 1 ELSE 0 END) as drawn,
    SUM(CASE WHEN scored < conceded THEN 1 ELSE 0 END) as lost,
    SUM(scored) as goals_for,
    SUM(conceded) as goals_against,
    SUM(scored - conceded) as goal_difference,
    SUM(CASE WHEN scored > conceded THEN 3 WHEN scored = conceded THEN 1 ELSE 0 END) as points,
    ROW_NUMBER() OVER (
      PARTITION BY competition_id, group_name
      ORDER BY 
        SUM(CASE WHEN scored > conceded THEN 3 WHEN scored = conceded THEN 1 ELSE 0 END) DESC,
        SUM(scored - conceded) DESC,
        SUM(scored) DESC
    ) as position
  FROM (
    SELECT m.competition_id, m.home_club_id as club_id, m.group_name, 
           COALESCE(m.home_score, 0) as scored, COALESCE(m.away_score, 0) as conceded
    FROM matches m WHERE m.competition_id = comp_id AND m.status = 'finished'
    UNION ALL
    SELECT m.competition_id, m.away_club_id as club_id, m.group_name,
           COALESCE(m.away_score, 0) as scored, COALESCE(m.home_score, 0) as conceded  
    FROM matches m WHERE m.competition_id = comp_id AND m.status = 'finished'
  ) match_results
  GROUP BY competition_id, club_id, group_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to auto-update standings when match finishes
CREATE OR REPLACE FUNCTION on_match_status_change_update_standings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only regenerate if match status changed to 'finished'
  IF NEW.status = 'finished' AND (OLD.status IS DISTINCT FROM 'finished') THEN
    PERFORM regenerate_competition_standings(NEW.competition_id);
  END IF;
  
  -- Also regenerate if scores change on a finished match
  IF NEW.status = 'finished' AND OLD.status = 'finished' AND 
     (NEW.home_score IS DISTINCT FROM OLD.home_score OR NEW.away_score IS DISTINCT FROM OLD.away_score) THEN
    PERFORM regenerate_competition_standings(NEW.competition_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_match_finished_update_standings ON matches;

CREATE TRIGGER on_match_finished_update_standings
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION on_match_status_change_update_standings();

-- Regenerate standings for all existing competitions with finished matches
DO $$
DECLARE
  comp_record RECORD;
BEGIN
  FOR comp_record IN 
    SELECT DISTINCT competition_id 
    FROM matches 
    WHERE status = 'finished'
  LOOP
    PERFORM regenerate_competition_standings(comp_record.competition_id);
  END LOOP;
END $$;