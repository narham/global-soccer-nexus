import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const PublicMatchesTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
    fetchMatches();

    // Subscribe to realtime updates for live matches
    const channel = supabase
      .channel('public-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.live'
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchMatches();
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      scheduled: { variant: "outline", label: "Dijadwalkan" },
      live: { variant: "default", label: "🔴 LIVE", className: "animate-pulse" },
      finished: { variant: "secondary", label: "Selesai" },
      postponed: { variant: "destructive", label: "Ditunda" },
      cancelled: { variant: "destructive", label: "Dibatalkan" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const liveMatches = matches.filter(m => m.status === "live");
  const otherMatches = matches.filter(m => m.status !== "live");

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
                <Calendar className="h-5 w-5 text-primary" />
                Jadwal Pertandingan
              </CardTitle>
              <CardDescription>Lihat jadwal dan hasil pertandingan</CardDescription>
            </div>
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger className="w-[300px]">
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
              {/* Live Matches Section */}
              {liveMatches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    🔴 Pertandingan Live
                  </h3>
                  {liveMatches.map((match) => (
                    <Card key={match.id} className="hover:shadow-md transition-shadow border-primary">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {match.competition.name}
                              </span>
                              {getStatusBadge(match.status)}
                            </div>
                            <div className="text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(match.match_date), "EEEE, d MMMM yyyy - HH:mm", { locale: id })} WIB
                              </div>
                              {match.venue && (
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.venue}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <Link to={`/public/clubs/${match.home_club.id}`} className="flex items-center gap-3 min-w-[200px] hover:opacity-80">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.home_club.logo_url || ""} alt={match.home_club.name} />
                                <AvatarFallback>{match.home_club.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium flex-1">{match.home_club.name}</span>
                            </Link>
                            
                            <div className="text-center min-w-[80px]">
                              <div className="text-2xl font-bold">
                                {match.home_score} - {match.away_score}
                              </div>
                            </div>
                            
                            <Link to={`/public/clubs/${match.away_club.id}`} className="flex items-center gap-3 min-w-[200px] hover:opacity-80">
                              <span className="font-medium flex-1 text-right">{match.away_club.name}</span>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.away_club.logo_url || ""} alt={match.away_club.name} />
                                <AvatarFallback>{match.away_club.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Other Matches */}
              {otherMatches.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {match.competition.name}
                          </span>
                          {getStatusBadge(match.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(match.match_date), "EEEE, d MMMM yyyy - HH:mm", { locale: id })} WIB
                          </div>
                          {match.venue && (
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3" />
                              {match.venue}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <Link to={`/public/clubs/${match.home_club.id}`} className="flex items-center gap-3 min-w-[200px] hover:opacity-80">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={match.home_club.logo_url || ""} alt={match.home_club.name} />
                            <AvatarFallback>{match.home_club.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium flex-1">{match.home_club.name}</span>
                        </Link>
                        
                        <div className="text-center min-w-[80px]">
                          {match.status === "finished" ? (
                            <div className="text-2xl font-bold">
                              {match.home_score} - {match.away_score}
                            </div>
                          ) : (
                            <div className="text-xl font-medium text-muted-foreground">
                              vs
                            </div>
                          )}
                        </div>
                        
                        <Link to={`/public/clubs/${match.away_club.id}`} className="flex items-center gap-3 min-w-[200px] hover:opacity-80">
                          <span className="font-medium flex-1 text-right">{match.away_club.name}</span>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={match.away_club.logo_url || ""} alt={match.away_club.name} />
                            <AvatarFallback>{match.away_club.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
