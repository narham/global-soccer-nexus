import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Target, Shield } from "lucide-react";

interface HeadToHeadComparisonProps {
  homeClubId: string;
  awayClubId: string;
  homeClub?: any;
  awayClub?: any;
}

export function HeadToHeadComparison({
  homeClubId,
  awayClubId,
  homeClub,
  awayClub,
}: HeadToHeadComparisonProps) {
  const [stats, setStats] = useState({
    totalMatches: 0,
    homeWins: 0,
    awayWins: 0,
    draws: 0,
    homeGoalsScored: 0,
    awayGoalsScored: 0,
    lastMeeting: null as any,
    recentMatches: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeadToHeadData();
  }, [homeClubId, awayClubId]);

  const fetchHeadToHeadData = async () => {
    try {
      setLoading(true);

      // Fetch all matches between these two teams
      const { data: matches, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(id, name, logo_url),
          competition:competitions(name)
        `)
        .or(
          `and(home_club_id.eq.${homeClubId},away_club_id.eq.${awayClubId}),and(home_club_id.eq.${awayClubId},away_club_id.eq.${homeClubId})`
        )
        .eq("status", "finished")
        .order("match_date", { ascending: false });

      if (error) throw error;

      if (!matches || matches.length === 0) {
        setStats({
          totalMatches: 0,
          homeWins: 0,
          awayWins: 0,
          draws: 0,
          homeGoalsScored: 0,
          awayGoalsScored: 0,
          lastMeeting: null,
          recentMatches: [],
        });
        return;
      }

      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;
      let homeGoalsScored = 0;
      let awayGoalsScored = 0;

      matches.forEach((match) => {
        const isHomeMatch = match.home_club_id === homeClubId;
        const homeScore = match.home_score || 0;
        const awayScore = match.away_score || 0;

        if (isHomeMatch) {
          homeGoalsScored += homeScore;
          awayGoalsScored += awayScore;

          if (homeScore > awayScore) homeWins++;
          else if (homeScore < awayScore) awayWins++;
          else draws++;
        } else {
          homeGoalsScored += awayScore;
          awayGoalsScored += homeScore;

          if (awayScore > homeScore) homeWins++;
          else if (awayScore < homeScore) awayWins++;
          else draws++;
        }
      });

      setStats({
        totalMatches: matches.length,
        homeWins,
        awayWins,
        draws,
        homeGoalsScored,
        awayGoalsScored,
        lastMeeting: matches[0],
        recentMatches: matches.slice(0, 5),
      });
    } catch (error: any) {
      console.error("Error fetching head-to-head data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Memuat data head-to-head...
        </CardContent>
      </Card>
    );
  }

  if (stats.totalMatches === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Head-to-Head
          </CardTitle>
          <CardDescription>Belum ada pertemuan sebelumnya antara kedua tim</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const homeWinPercentage = ((stats.homeWins / stats.totalMatches) * 100).toFixed(0);
  const awayWinPercentage = ((stats.awayWins / stats.totalMatches) * 100).toFixed(0);
  const drawPercentage = ((stats.draws / stats.totalMatches) * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Head-to-Head Statistics
        </CardTitle>
        <CardDescription>{stats.totalMatches} Pertemuan Sebelumnya</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Record */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-600">{stats.homeWins}</div>
            <div className="text-sm text-muted-foreground">Menang</div>
            <div className="text-xs text-muted-foreground">{homeWinPercentage}%</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-muted-foreground">{stats.draws}</div>
            <div className="text-sm text-muted-foreground">Seri</div>
            <div className="text-xs text-muted-foreground">{drawPercentage}%</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-red-600">{stats.awayWins}</div>
            <div className="text-sm text-muted-foreground">Menang</div>
            <div className="text-xs text-muted-foreground">{awayWinPercentage}%</div>
          </div>
        </div>

        <Separator />

        {/* Goals Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Gol Dicetak</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.homeGoalsScored}</span>
              <span className="text-xs text-muted-foreground">
                Avg: {(stats.homeGoalsScored / stats.totalMatches).toFixed(1)} per match
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-medium">Gol Dicetak</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Avg: {(stats.awayGoalsScored / stats.totalMatches).toFixed(1)} per match
              </span>
              <span className="text-2xl font-bold">{stats.awayGoalsScored}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recent Matches */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">5 Pertemuan Terakhir</h4>
          </div>
          {stats.recentMatches.map((match, index) => {
            const isHomeMatch = match.home_club_id === homeClubId;
            const result =
              match.home_score > match.away_score
                ? isHomeMatch
                  ? "W"
                  : "L"
                : match.home_score < match.away_score
                ? isHomeMatch
                  ? "L"
                  : "W"
                : "D";

            return (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 border rounded-lg text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={result === "W" ? "default" : result === "L" ? "destructive" : "secondary"}
                  >
                    {result}
                  </Badge>
                  {index === 0 && <Badge variant="outline">Terbaru</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{match.home_club?.name}</span>
                  <span className="font-bold">
                    {match.home_score} - {match.away_score}
                  </span>
                  <span className="font-medium">{match.away_club?.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {match.competition?.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Meeting Highlight */}
        {stats.lastMeeting && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Pertemuan Terakhir</h4>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stats.lastMeeting.home_club?.name}</span>
                  <span className="text-xl font-bold">
                    {stats.lastMeeting.home_score} - {stats.lastMeeting.away_score}
                  </span>
                  <span className="font-medium">{stats.lastMeeting.away_club?.name}</span>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {stats.lastMeeting.competition?.name} •{" "}
                  {new Date(stats.lastMeeting.match_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
