import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "./PublicNav";
import { ArrowLeft, Calendar, MapPin, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function PublicPlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState<any>(null);
  const [club, setClub] = useState<any>(null);
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayerDetails();
  }, [id]);

  const fetchPlayerDetails = async () => {
    setLoading(true);

    // Fetch player info (using public view to exclude NIK)
    const { data: playerData } = await supabase
      .from("players_public")
      .select("*")
      .eq("id", id)
      .single();

    // Fetch club
    if (playerData?.current_club_id) {
      const { data: clubData } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", playerData.current_club_id)
        .single();
      setClub(clubData);
    }

    // Fetch statistics
    const { data: statsData } = await supabase
      .from("player_statistics")
      .select("*")
      .eq("player_id", id)
      .order("season", { ascending: false });

    setPlayer(playerData);
    setStatistics(statsData || []);
    setLoading(false);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const totalStats = statistics.reduce(
    (acc, stat) => ({
      goals: acc.goals + (stat.goals || 0),
      assists: acc.assists + (stat.assists || 0),
      matches: acc.matches + (stat.matches_played || 0),
      yellowCards: acc.yellowCards + (stat.yellow_cards || 0),
      redCards: acc.redCards + (stat.red_cards || 0),
    }),
    { goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 }
  );

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

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="container mx-auto px-4 py-8">
          <p>Pemain tidak ditemukan</p>
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

        {/* Player Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={player.photo_url || ""} alt={player.full_name} />
                <AvatarFallback className="text-2xl">{player.full_name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{player.full_name}</h1>
                  {player.shirt_number && (
                    <Badge variant="secondary" className="text-xl px-3 py-1">
                      #{player.shirt_number}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{player.position}</Badge>
                  <Badge variant="outline">{player.nationality}</Badge>
                  {player.preferred_foot && (
                    <Badge variant="outline">Kaki {player.preferred_foot}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Usia</p>
                    <p className="font-semibold">{calculateAge(player.date_of_birth)} tahun</p>
                  </div>
                  {player.height_cm && (
                    <div>
                      <p className="text-muted-foreground">Tinggi</p>
                      <p className="font-semibold">{player.height_cm} cm</p>
                    </div>
                  )}
                  {player.weight_kg && (
                    <div>
                      <p className="text-muted-foreground">Berat</p>
                      <p className="font-semibold">{player.weight_kg} kg</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Lahir</p>
                    <p className="font-semibold">{format(new Date(player.date_of_birth), "dd MMM yyyy")}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Current Club */}
          {club && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Klub Saat Ini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/public/clubs/${club.id}`}>
                  <div className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                    <Avatar>
                      <AvatarImage src={club.logo_url || ""} alt={club.name} />
                      <AvatarFallback>{club.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{club.name}</p>
                      <p className="text-sm text-muted-foreground">{club.city}</p>
                    </div>
                  </div>
                </Link>
                {player.contract_end && (
                  <div className="mt-3 text-sm">
                    <p className="text-muted-foreground">Kontrak hingga</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(player.contract_end), "dd MMMM yyyy")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Career Statistics */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistik Karir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalStats.goals}</p>
                  <p className="text-sm text-muted-foreground">Gol</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalStats.assists}</p>
                  <p className="text-sm text-muted-foreground">Assist</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{totalStats.matches}</p>
                  <p className="text-sm text-muted-foreground">Pertandingan</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">{totalStats.yellowCards}</p>
                  <p className="text-sm text-muted-foreground">Kartu Kuning</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{totalStats.redCards}</p>
                  <p className="text-sm text-muted-foreground">Kartu Merah</p>
                </div>
              </div>

              {/* Per Season Statistics */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Statistik Per Musim
                </h4>
                {statistics.map((stat, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-semibold mb-2">{stat.season}</p>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Gol</p>
                        <p className="font-semibold">{stat.goals || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assist</p>
                        <p className="font-semibold">{stat.assists || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Main</p>
                        <p className="font-semibold">{stat.matches_played || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Menit</p>
                        <p className="font-semibold">{stat.minutes_played || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kartu</p>
                        <p className="font-semibold">
                          <span className="text-yellow-500">{stat.yellow_cards || 0}</span>/
                          <span className="text-red-500">{stat.red_cards || 0}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
