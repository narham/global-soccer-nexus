import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Trophy, Target } from "lucide-react";
import { Input } from "@/components/ui/input";

export const PublicPlayersTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedCompetition]);

  const fetchCompetitions = async () => {
    try {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .eq("approval_status", "approved")
        .order("start_date", { ascending: false });

      if (data) {
        setCompetitions(data);
      }
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setLoadingStats(true);
    try {
      let query = supabase
        .from("player_statistics")
        .select(`
          *,
          player:players_public(id, full_name, photo_url, position, current_club:clubs(name, logo_url))
        `)
        .order("goals", { ascending: false })
        .limit(50);

      if (selectedCompetition !== "all") {
        query = query.eq("competition_id", selectedCompetition);
      }

      const { data } = await query;
      setStatistics(data || []);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const filteredStats = statistics.filter(stat => 
    stat.player?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topScorers = filteredStats.slice(0, 10);
  const topAssisters = [...filteredStats].sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Statistik Pemain
              </CardTitle>
              <CardDescription>Top skor dan assist terbaik</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Cari pemain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Semua kompetisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kompetisi</SelectItem>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name} ({comp.season})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Scorers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Pencetak Gol
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : topScorers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada data statistik
              </p>
            ) : (
              <div className="space-y-2">
                {topScorers.map((stat, index) => (
                  <Link
                    key={stat.id}
                    to={`/public/players/${stat.player.id}`}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8">
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        {index + 1}
                      </Badge>
                    </div>
                    {stat.player?.photo_url && (
                      <img 
                        src={stat.player.photo_url} 
                        alt={stat.player.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{stat.player?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.player?.current_club?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{stat.goals}</p>
                      <p className="text-xs text-muted-foreground">gol</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Assisters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-4 w-4 text-blue-500" />
              Top Assist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : topAssisters.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada data statistik
              </p>
            ) : (
              <div className="space-y-2">
                {topAssisters.map((stat, index) => (
                  <Link
                    key={stat.id}
                    to={`/public/players/${stat.player.id}`}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-8 h-8">
                      <Badge variant={index < 3 ? "default" : "outline"}>
                        {index + 1}
                      </Badge>
                    </div>
                    {stat.player?.photo_url && (
                      <img 
                        src={stat.player.photo_url} 
                        alt={stat.player.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{stat.player?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.player?.current_club?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{stat.assists}</p>
                      <p className="text-xs text-muted-foreground">assist</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
