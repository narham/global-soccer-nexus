import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MatchCard = ({ match, isLive = false }: { match: any; isLive?: boolean }) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      scheduled: { variant: "outline", label: "Dijadwalkan" },
      first_half: { variant: "default", label: "⚽ Babak 1", className: "animate-pulse" },
      half_time: { variant: "outline", label: "☕ Istirahat" },
      second_half: { variant: "default", label: "⚽ Babak 2", className: "animate-pulse" },
      live: { variant: "default", label: "🔴 LIVE", className: "animate-pulse" },
      finished: { variant: "secondary", label: "Selesai" },
      postponed: { variant: "destructive", label: "Ditunda" },
      cancelled: { variant: "destructive", label: "Dibatalkan" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isLive ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        {/* Header: competition name + status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground truncate">
            {match.competition?.name}
          </span>
          {getStatusBadge(match.status)}
        </div>

        {/* Date & Venue */}
        <div className="text-sm text-muted-foreground mb-3 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {format(new Date(match.match_date), "EEE, d MMM yyyy - HH:mm", { locale: id })} WIB
            </span>
          </div>
          {match.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{match.venue}</span>
            </div>
          )}
        </div>

        {/* Teams & Score - Mobile responsive */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to={`/public/clubs/${match.home_club?.id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={match.home_club?.logo_url || ""} alt={match.home_club?.name} />
              <AvatarFallback className="text-xs">{match.home_club?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span className="font-medium truncate text-sm sm:text-base">
              {match.home_club?.short_name || match.home_club?.name}
            </span>
          </Link>
          
          <div className="text-center shrink-0 min-w-[60px]">
            {match.status === "finished" || match.status === "live" ? (
              <div className="text-xl sm:text-2xl font-bold">
                {match.home_score} - {match.away_score}
              </div>
            ) : (
              <div className="text-lg font-medium text-muted-foreground">vs</div>
            )}
          </div>
          
          <Link to={`/public/clubs/${match.away_club?.id}`} className="flex items-center gap-2 flex-1 min-w-0 justify-end hover:opacity-80">
            <span className="font-medium truncate text-sm sm:text-base text-right">
              {match.away_club?.short_name || match.away_club?.name}
            </span>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={match.away_club?.logo_url || ""} alt={match.away_club?.name} />
              <AvatarFallback className="text-xs">{match.away_club?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export const PublicMatchesTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
    fetchMatches();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [selectedCompetition, statusFilter]);

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

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      let query = supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!home_club_id(id, name, logo_url, short_name),
          away_club:clubs!away_club_id(id, name, logo_url, short_name),
          competition:competitions(id, name, season)
        `)
        .order("match_date", { ascending: false })
        .limit(20);

      if (selectedCompetition !== "all") {
        query = query.eq("competition_id", selectedCompetition);
      }

      // Apply match status filter based on competition status filter
      if (statusFilter === "ongoing") {
        query = query.in("status", ["live", "first_half", "half_time", "second_half", "scheduled"]);
      } else if (statusFilter === "finished") {
        query = query.eq("status", "finished");
      } else if (statusFilter === "upcoming") {
        query = query.eq("status", "scheduled");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching matches:", error);
        toast({ title: "Error", description: "Gagal memuat pertandingan", variant: "destructive" });
        return;
      }

      setMatches(data || []);
    } catch (error: any) {
      console.error("Error fetching matches:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMatches(false);
    }
  };

  const liveMatches = matches.filter(m => ["live", "first_half", "half_time", "second_half"].includes(m.status));
  const otherMatches = matches.filter(m => !["live", "first_half", "half_time", "second_half"].includes(m.status));

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Jadwal Pertandingan
              </CardTitle>
              <CardDescription>Lihat jadwal dan hasil pertandingan</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
              <div className="flex gap-1 flex-wrap">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'ongoing', label: 'Berjalan' },
                  { key: 'upcoming', label: 'Akan Datang' },
                  { key: 'finished', label: 'Selesai' },
                ].map((s) => (
                  <Button
                    key={s.key}
                    variant={statusFilter === s.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(s.key)}
                    className="text-xs"
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMatches ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada pertandingan yang tersedia
            </p>
          ) : (
            <div className="space-y-4">
              {liveMatches.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    🔴 Pertandingan Live
                  </h3>
                  {liveMatches.map((match) => (
                    <MatchCard key={match.id} match={match} isLive />
                  ))}
                </div>
              )}

              {otherMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
