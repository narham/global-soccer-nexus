import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Users, MapPin, Cloud } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface MatchPreviewCardProps {
  match: any;
  homeClubId: string;
  awayClubId: string;
}

export function MatchPreviewCard({ match, homeClubId, awayClubId }: MatchPreviewCardProps) {
  const [homeForm, setHomeForm] = useState<string[]>([]);
  const [awayForm, setAwayForm] = useState<string[]>([]);
  const [homeTopPlayer, setHomeTopPlayer] = useState<any>(null);
  const [awayTopPlayer, setAwayTopPlayer] = useState<any>(null);
  const [prediction, setPrediction] = useState({ home: 0, draw: 0, away: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviewData();
  }, [homeClubId, awayClubId]);

  const fetchPreviewData = async () => {
    try {
      setLoading(true);

      // Fetch recent form for both teams (last 5 matches)
      const homeFormData = await fetchTeamForm(homeClubId);
      const awayFormData = await fetchTeamForm(awayClubId);

      setHomeForm(homeFormData);
      setAwayForm(awayFormData);

      // Fetch top scorers for both teams
      const homePlayer = await fetchTopPlayer(homeClubId);
      const awayPlayer = await fetchTopPlayer(awayClubId);

      setHomeTopPlayer(homePlayer);
      setAwayTopPlayer(awayPlayer);

      // Calculate simple prediction based on recent form
      const homePrediction = calculatePrediction(homeFormData, awayFormData);
      setPrediction(homePrediction);
    } catch (error: any) {
      console.error("Error fetching preview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamForm = async (clubId: string): Promise<string[]> => {
    try {
      const { data: matches, error } = await supabase
        .from("matches")
        .select("*")
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .eq("status", "finished")
        .order("match_date", { ascending: false })
        .limit(5);

      if (error) throw error;

      return (matches || []).map((match) => {
        const isHome = match.home_club_id === clubId;
        const teamScore = isHome ? match.home_score : match.away_score;
        const opponentScore = isHome ? match.away_score : match.home_score;

        if (teamScore > opponentScore) return "W";
        if (teamScore < opponentScore) return "L";
        return "D";
      });
    } catch (error) {
      console.error("Error fetching team form:", error);
      return [];
    }
  };

  const fetchTopPlayer = async (clubId: string) => {
    try {
      // Get matches for this club
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .eq("status", "finished");

      if (!matches || matches.length === 0) return null;

      const matchIds = matches.map((m) => m.id);

      // Get top scorer from this club
      const { data: events } = await supabase
        .from("match_events")
        .select(`
          player_id,
          player:players(id, full_name, photo_url, position)
        `)
        .eq("event_type", "goal")
        .in("match_id", matchIds);

      if (!events || events.length === 0) return null;

      // Count goals per player
      const goalCounts = events.reduce((acc: any, event: any) => {
        const playerId = event.player_id;
        if (!acc[playerId]) {
          acc[playerId] = { player: event.player, goals: 0 };
        }
        acc[playerId].goals++;
        return acc;
      }, {});

      // Get top scorer
      const topScorer = Object.values(goalCounts).sort((a: any, b: any) => b.goals - a.goals)[0];
      return topScorer;
    } catch (error) {
      console.error("Error fetching top player:", error);
      return null;
    }
  };

  const calculatePrediction = (homeForm: string[], awayForm: string[]) => {
    // Simple prediction based on recent form
    const homePoints = homeForm.reduce((acc, result) => {
      if (result === "W") return acc + 3;
      if (result === "D") return acc + 1;
      return acc;
    }, 0);

    const awayPoints = awayForm.reduce((acc, result) => {
      if (result === "W") return acc + 3;
      if (result === "D") return acc + 1;
      return acc;
    }, 0);

    const totalPoints = homePoints + awayPoints;
    const homePrediction = totalPoints > 0 ? Math.round((homePoints / totalPoints) * 100) : 33;
    const awayPrediction = totalPoints > 0 ? Math.round((awayPoints / totalPoints) * 100) : 33;
    const drawPrediction = 100 - homePrediction - awayPrediction;

    return {
      home: homePrediction,
      draw: Math.max(0, drawPrediction),
      away: awayPrediction,
    };
  };

  const getFormBadge = (result: string) => {
    const variants: any = {
      W: { variant: "default", label: "W", color: "text-green-600" },
      D: { variant: "secondary", label: "D", color: "text-yellow-600" },
      L: { variant: "destructive", label: "L", color: "text-red-600" },
    };
    const config = variants[result] || variants.D;
    return (
      <Badge variant={config.variant} className="w-8 h-8 flex items-center justify-center">
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Memuat pratinjau pertandingan...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pratinjau Pertandingan
        </CardTitle>
        <CardDescription>Analisis & Prediksi berdasarkan performa terkini</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recent Form */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Form 5 Pertandingan Terakhir</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{match.home_club?.name}</div>
              <div className="flex gap-1">
                {homeForm.length > 0 ? (
                  homeForm.map((result, index) => (
                    <div key={index}>{getFormBadge(result)}</div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Tidak ada data</span>
                )}
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="text-sm font-medium">{match.away_club?.name}</div>
              <div className="flex gap-1 justify-end">
                {awayForm.length > 0 ? (
                  awayForm.map((result, index) => (
                    <div key={index}>{getFormBadge(result)}</div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Tidak ada data</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Players */}
        {(homeTopPlayer || awayTopPlayer) && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Pemain Kunci</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {homeTopPlayer && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {homeTopPlayer.player?.photo_url && (
                      <img
                        src={homeTopPlayer.player.photo_url}
                        alt={homeTopPlayer.player.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {homeTopPlayer.player?.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {homeTopPlayer.goals} gol • {homeTopPlayer.player?.position}
                      </div>
                    </div>
                  </div>
                )}
                {awayTopPlayer && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    {awayTopPlayer.player?.photo_url && (
                      <img
                        src={awayTopPlayer.player.photo_url}
                        alt={awayTopPlayer.player.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {awayTopPlayer.player?.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {awayTopPlayer.goals} gol • {awayTopPlayer.player?.position}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Prediction */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Prediksi Hasil (Berdasarkan Form)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">{prediction.home}%</div>
              <div className="text-xs text-muted-foreground">Menang Tuan Rumah</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-muted-foreground">{prediction.draw}%</div>
              <div className="text-xs text-muted-foreground">Seri</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">{prediction.away}%</div>
              <div className="text-xs text-muted-foreground">Menang Tandang</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Match Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Venue:</span>
            <span className="text-muted-foreground">{match.venue || "TBD"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Kondisi:</span>
            <span className="text-muted-foreground">
              {match.weather_condition || "Informasi cuaca belum tersedia"}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          ⚠️ Prediksi berdasarkan data statistik dan tidak menjamin hasil akhir pertandingan
        </div>
      </CardContent>
    </Card>
  );
}
