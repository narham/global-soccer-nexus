import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MatchHeader } from "@/components/matches/MatchHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchLineupTab } from "@/components/matches/MatchLineupTab";
import { MatchEventsTab } from "@/components/matches/MatchEventsTab";
import { MatchStatsTab } from "@/components/matches/MatchStatsTab";
import { MatchReportTab } from "@/components/matches/MatchReportTab";
import { toast } from "sonner";

const ClubMatchDetailPage = () => {
  const { id: clubId, matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("matches")
          .select(`
            *,
            home_club:clubs!matches_home_club_id_fkey(*),
            away_club:clubs!matches_away_club_id_fkey(*),
            competition:competitions(*)
          `)
          .eq("id", matchId)
          .single();

        if (error) throw error;
        setMatch(data);
      } catch (error: any) {
        toast.error(error.message);
        navigate(`/clubs/${clubId}/matches`);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchMatch();
    }
  }, [matchId, clubId, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!match) {
    return <div>Pertandingan tidak ditemukan</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/clubs/${clubId}/matches`)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Pertandingan
      </Button>

      <MatchHeader match={match} />

      <Tabs defaultValue="lineup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lineup">Lineup</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="stats">Statistik</TabsTrigger>
          <TabsTrigger value="report">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="mt-6">
          <MatchLineupTab matchId={match.id} homeClub={match.home_club} awayClub={match.away_club} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <MatchEventsTab matchId={match.id} homeClub={match.home_club} awayClub={match.away_club} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <MatchStatsTab matchId={match.id} homeClub={match.home_club} awayClub={match.away_club} />
        </TabsContent>

        <TabsContent value="report" className="mt-6">
          <MatchReportTab match={match} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubMatchDetailPage;
