import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicNav } from "@/components/public/PublicNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users, Target, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function PublicCompetitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCompetitionData();
    }
  }, [id]);

  const fetchCompetitionData = async () => {
    try {
      setLoading(true);

      // Fetch competition details
      const { data: compData, error: compError } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();

      if (compError) throw compError;
      setCompetition(compData);

      // Fetch standings
      const { data: standingsData, error: standingsError } = await supabase
        .from("standings")
        .select(`
          *,
          club:clubs(id, name, logo_url)
        `)
        .eq("competition_id", id)
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false });

      if (standingsError) throw standingsError;
      setStandings(standingsData || []);

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(id, name, logo_url)
        `)
        .eq("competition_id", id)
        .order("match_date", { ascending: false });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("competition_teams")
        .select(`
          *,
          club:clubs(id, name, logo_url, city)
        `)
        .eq("competition_id", id)
        .order("seed", { ascending: true });

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch top scorers
      const { data: scorersData, error: scorersError } = await supabase
        .from("match_events")
        .select(`
          player_id,
          player:players(id, full_name, photo_url, current_club_id, clubs:clubs(name, logo_url)),
          count:id.count()
        `)
        .eq("event_type", "goal")
        .in(
          "match_id",
          matchesData?.map((m) => m.id) || []
        )
        .order("count", { ascending: false })
        .limit(10);

      if (scorersError) throw scorersError;
      
      // Group by player and count goals
      const scorersMap = new Map();
      scorersData?.forEach((event: any) => {
        const playerId = event.player_id;
        if (scorersMap.has(playerId)) {
          scorersMap.get(playerId).goals++;
        } else {
          scorersMap.set(playerId, {
            player: event.player,
            goals: 1,
          });
        }
      });

      const topScorersArray = Array.from(scorersMap.values())
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10);

      setTopScorers(topScorersArray);
    } catch (error: any) {
      console.error("Error fetching competition data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      upcoming: "secondary",
      ongoing: "default",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getMatchStatusBadge = (status: string) => {
    const variants: any = {
      scheduled: "secondary",
      live: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <div className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground">Memuat data kompetisi...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen">
        <PublicNav />
        <div className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground">Kompetisi tidak ditemukan</p>
          <Button onClick={() => navigate("/public")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  // Group standings by group if applicable
  const groupedStandings = competition.format === "group_knockout" 
    ? standings.reduce((acc: any, standing: any) => {
        const group = standing.group_name || "No Group";
        if (!acc[group]) acc[group] = [];
        acc[group].push(standing);
        return acc;
      }, {})
    : { "All Teams": standings };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/public")}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </div>
            <div className="flex items-center gap-4">
              {competition.logo_url && (
                <img
                  src={competition.logo_url}
                  alt={competition.name}
                  className="h-20 w-20 object-contain"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{competition.name}</CardTitle>
                  {getStatusBadge(competition.status)}
                </div>
                <CardDescription className="flex items-center gap-4 text-base">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    {competition.type}
                  </span>
                  <span>•</span>
                  <span>{competition.format}</span>
                  <span>•</span>
                  <span>{competition.season}</span>
                </CardDescription>
                {competition.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{competition.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(competition.start_date), "dd MMM yyyy", { locale: idLocale })}
                  {competition.end_date && (
                    <> - {format(new Date(competition.end_date), "dd MMM yyyy", { locale: idLocale })}</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{teams.length} Tim Peserta</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="standings">📊 Klasemen</TabsTrigger>
            <TabsTrigger value="matches">📅 Jadwal & Hasil</TabsTrigger>
            <TabsTrigger value="scorers">⚽ Top Scorers</TabsTrigger>
            <TabsTrigger value="teams">🏆 Tim Peserta</TabsTrigger>
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-4">
            {Object.entries(groupedStandings).map(([groupName, groupStandings]: [string, any]) => (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle>{groupName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Pos</th>
                          <th className="text-left p-2">Tim</th>
                          <th className="text-center p-2">Main</th>
                          <th className="text-center p-2">M</th>
                          <th className="text-center p-2">S</th>
                          <th className="text-center p-2">K</th>
                          <th className="text-center p-2">GM</th>
                          <th className="text-center p-2">GK</th>
                          <th className="text-center p-2">SG</th>
                          <th className="text-center p-2 font-bold">Poin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupStandings.map((standing: any, index: number) => (
                          <tr key={standing.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-bold">{index + 1}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {standing.club?.logo_url && (
                                  <img
                                    src={standing.club.logo_url}
                                    alt={standing.club.name}
                                    className="h-6 w-6 object-contain"
                                  />
                                )}
                                <span className="font-medium">{standing.club?.name}</span>
                              </div>
                            </td>
                            <td className="text-center p-2">{standing.played || 0}</td>
                            <td className="text-center p-2">{standing.won || 0}</td>
                            <td className="text-center p-2">{standing.drawn || 0}</td>
                            <td className="text-center p-2">{standing.lost || 0}</td>
                            <td className="text-center p-2">{standing.goals_for || 0}</td>
                            <td className="text-center p-2">{standing.goals_against || 0}</td>
                            <td className="text-center p-2">{standing.goal_difference || 0}</td>
                            <td className="text-center p-2 font-bold">{standing.points || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Belum ada jadwal pertandingan
                </CardContent>
              </Card>
            ) : (
              matches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-3 items-center gap-4">
                        {/* Home Team */}
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-right">{match.home_club?.name}</span>
                          {match.home_club?.logo_url && (
                            <img
                              src={match.home_club.logo_url}
                              alt={match.home_club.name}
                              className="h-8 w-8 object-contain"
                            />
                          )}
                        </div>

                        {/* Score or Time */}
                        <div className="text-center space-y-1">
                          {match.status === "completed" ? (
                            <div className="text-2xl font-bold">
                              {match.home_score} - {match.away_score}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(match.match_date), "HH:mm", { locale: idLocale })}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(match.match_date), "dd MMM yyyy", { locale: idLocale })}
                          </div>
                          {getMatchStatusBadge(match.status)}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center gap-2">
                          {match.away_club?.logo_url && (
                            <img
                              src={match.away_club.logo_url}
                              alt={match.away_club.name}
                              className="h-8 w-8 object-contain"
                            />
                          )}
                          <span className="font-semibold">{match.away_club?.name}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/public/matches/${match.id}`)}
                      >
                        Detail
                      </Button>
                    </div>
                    {match.venue && (
                      <div className="mt-2 text-xs text-muted-foreground text-center">
                        📍 {match.venue}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Top Scorers Tab */}
          <TabsContent value="scorers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Pencetak Gol Terbanyak
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topScorers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Belum ada data pencetak gol
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topScorers.map((scorer, index) => (
                      <div
                        key={scorer.player?.id || index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xl font-bold text-muted-foreground w-8">
                            {index + 1}
                          </div>
                          {scorer.player?.photo_url && (
                            <img
                              src={scorer.player.photo_url}
                              alt={scorer.player.full_name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="font-semibold">{scorer.player?.full_name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              {scorer.player?.clubs?.logo_url && (
                                <img
                                  src={scorer.player.clubs.logo_url}
                                  alt={scorer.player.clubs.name}
                                  className="h-4 w-4 object-contain"
                                />
                              )}
                              {scorer.player?.clubs?.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold">{scorer.goals} ⚽</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {team.club?.logo_url && (
                        <img
                          src={team.club.logo_url}
                          alt={team.club.name}
                          className="h-16 w-16 object-contain"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{team.club?.name}</h3>
                        <p className="text-sm text-muted-foreground">{team.club?.city}</p>
                        {team.group_name && (
                          <Badge variant="outline" className="mt-1">
                            {team.group_name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/public/clubs/${team.club.id}`)}
                      >
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
