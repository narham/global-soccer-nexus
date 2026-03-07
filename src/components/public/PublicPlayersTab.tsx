import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Trophy, Target, Search, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PlayerStatRow = ({ stat, index, valueKey, valueLabel }: { stat: any; index: number; valueKey: string; valueLabel: string }) => (
  <Link
    to={`/public/players/${stat.player?.id}`}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
  >
    <div className="flex items-center justify-center w-7 h-7">
      {index < 3 ? (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          index === 0 ? 'bg-secondary/30 text-secondary-foreground' : 
          index === 1 ? 'bg-muted text-muted-foreground' : 
          'bg-primary/15 text-primary'
        }`}>
          {index + 1}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground font-medium">{index + 1}</span>
      )}
    </div>
    <Avatar className="h-9 w-9 border border-border">
      <AvatarImage src={stat.player?.photo_url || ""} alt={stat.player?.full_name} />
      <AvatarFallback className="text-xs">{stat.player?.full_name?.substring(0, 2)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{stat.player?.full_name}</p>
      <p className="text-xs text-muted-foreground truncate">
        {stat.player?.current_club?.name || "Tanpa Klub"}
      </p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-xl font-bold text-primary tabular-nums">{stat[valueKey] ?? 0}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{valueLabel}</p>
    </div>
  </Link>
);

export const PublicPlayersTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedCompetition]);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("approval_status", "approved")
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching competitions:", error);
        toast({ title: "Error", description: "Gagal memuat kompetisi", variant: "destructive" });
        return;
      }

      setCompetitions(data || []);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          player:players_public(id, full_name, photo_url, position, current_club_id)
        `)
        .order("goals", { ascending: false })
        .limit(50);

      if (selectedCompetition !== "all") {
        query = query.eq("competition_id", selectedCompetition);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching statistics:", error);
        toast({ title: "Error", description: "Gagal memuat statistik", variant: "destructive" });
        return;
      }

      if (data && data.length > 0) {
        const clubIds = [...new Set(data.map(s => s.player?.current_club_id).filter(Boolean))];
        const { data: clubs } = await supabase
          .from("clubs")
          .select("id, name, logo_url")
          .in("id", clubIds);

        const clubMap = (clubs || []).reduce((acc: any, club) => {
          acc[club.id] = club;
          return acc;
        }, {});

        const enrichedData = data.map(stat => ({
          ...stat,
          player: stat.player ? {
            ...stat.player,
            current_club: clubMap[stat.player.current_club_id] || null
          } : null
        }));

        setStatistics(enrichedData);
      } else {
        setStatistics(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama pemain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger className="w-full sm:w-[250px]">
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Scorers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-yellow-600" />
              </div>
              Top Pencetak Gol
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingStats ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
            ) : topScorers.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data statistik</p>
              </div>
            ) : (
              <div className="space-y-1 -mx-3">
                {topScorers.map((stat, index) => (
                  <PlayerStatRow key={stat.id} stat={stat} index={index} valueKey="goals" valueLabel="gol" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Assisters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-accent" />
              </div>
              Top Assist
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingStats ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-8" />
                  </div>
                ))}
              </div>
            ) : topAssisters.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Belum ada data statistik</p>
              </div>
            ) : (
              <div className="space-y-1 -mx-3">
                {topAssisters.map((stat, index) => (
                  <PlayerStatRow key={stat.id} stat={stat} index={index} valueKey="assists" valueLabel="assist" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
