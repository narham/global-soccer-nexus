import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "./PublicNav";
import { ArrowLeft, MapPin, Calendar, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function PublicClubDetailPage() {
  const { id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubDetails();
  }, [id]);

  const fetchClubDetails = async () => {
    setLoading(true);
    
    // Fetch club info
    const { data: clubData } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", id)
      .single();

    // Fetch players (using public view to exclude NIK)
    const { data: playersData } = await supabase
      .from("players_public")
      .select("*")
      .eq("current_club_id", id)
      .order("position", { ascending: true });

    // Fetch recent matches
    const { data: matchesData } = await supabase
      .from("matches")
      .select(`
        *,
        home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
        away_club:clubs!matches_away_club_id_fkey(id, name, logo_url),
        competition:competitions(name, logo_url)
      `)
      .or(`home_club_id.eq.${id},away_club_id.eq.${id}`)
      .order("match_date", { ascending: false })
      .limit(5);

    // Fetch standings
    const { data: standingsData } = await supabase
      .from("standings")
      .select("*, competition:competitions(name)")
      .eq("club_id", id)
      .order("points", { ascending: false })
      .limit(1)
      .maybeSingle();

    setClub(clubData);
    setPlayers(playersData || []);
    setMatches(matchesData || []);
    setStandings(standingsData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="container mx-auto px-4 py-8">
          <p>Klub tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      
      <div className="container mx-auto px-4 py-8">
        <Link to="/public">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Portal
          </Button>
        </Link>

        {/* Club Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={club.logo_url || ""} alt={club.name} />
                <AvatarFallback>{club.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  {club.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{club.city}</span>
                    </div>
                  )}
                  {club.founded_year && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Berdiri {club.founded_year}</span>
                    </div>
                  )}
                  {club.stadium_name && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{club.stadium_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Standings */}
          {standings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Klasemen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {standings.competition?.name}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{standings.position}</p>
                    <p className="text-sm text-muted-foreground">Posisi</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{standings.points}</p>
                    <p className="text-sm text-muted-foreground">Poin</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{standings.won}M</p>
                    <p className="text-sm text-muted-foreground">Menang</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{standings.drawn}S</p>
                    <p className="text-sm text-muted-foreground">Seri</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{standings.lost}K</p>
                    <p className="text-sm text-muted-foreground">Kalah</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{standings.goals_for}:{standings.goals_against}</p>
                    <p className="text-sm text-muted-foreground">Gol</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Matches */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Pertandingan Terakhir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {match.competition?.name} • {format(new Date(match.match_date), "dd MMM yyyy")}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={match.home_club?.logo_url || ""} />
                            <AvatarFallback>{match.home_club?.name?.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className={match.home_club_id === id ? "font-bold" : ""}>
                            {match.home_club?.name}
                          </span>
                        </div>
                        <div className="text-center min-w-[60px]">
                          {match.status === "finished" ? (
                            <span className="font-bold">{match.home_score} - {match.away_score}</span>
                          ) : (
                            <Badge variant="outline">{match.status === "live" ? "LIVE" : "Scheduled"}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className={match.away_club_id === id ? "font-bold" : ""}>
                            {match.away_club?.name}
                          </span>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={match.away_club?.logo_url || ""} />
                            <AvatarFallback>{match.away_club?.name?.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Skuad Pemain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {players.map((player) => (
                <Link key={player.id} to={`/public/players/${player.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={player.photo_url || ""} alt={player.full_name} />
                          <AvatarFallback>{player.full_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{player.full_name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {player.position}
                            </Badge>
                            {player.shirt_number && (
                              <span className="text-xs text-muted-foreground">#{player.shirt_number}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
