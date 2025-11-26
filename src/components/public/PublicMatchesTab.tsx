import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const PublicMatchesTab = () => {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    fetchCompetitions();
    fetchMatches();
  }, []);

  useEffect(() => {
    fetchMatches();
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

  const fetchMatches = async () => {
    setLoadingMatches(true);
    try {
      let query = supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(id, name, logo_url, short_name),
          away_club:clubs!matches_away_club_id_fkey(id, name, logo_url, short_name),
          competition:competitions(id, name, season)
        `)
        .order("match_date", { ascending: false })
        .limit(20);

      if (selectedCompetition !== "all") {
        query = query.eq("competition_id", selectedCompetition);
      }

      const { data } = await query;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoadingMatches(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      scheduled: { variant: "outline", label: "Dijadwalkan" },
      live: { variant: "default", label: "Live" },
      finished: { variant: "secondary", label: "Selesai" },
      postponed: { variant: "destructive", label: "Ditunda" },
      cancelled: { variant: "destructive", label: "Dibatalkan" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
              {matches.map((match) => (
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
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {match.home_club.logo_url && (
                            <img 
                              src={match.home_club.logo_url} 
                              alt={match.home_club.name}
                              className="h-8 w-8 object-contain"
                            />
                          )}
                          <span className="font-medium flex-1">{match.home_club.name}</span>
                        </div>
                        
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
                        
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span className="font-medium flex-1 text-right">{match.away_club.name}</span>
                          {match.away_club.logo_url && (
                            <img 
                              src={match.away_club.logo_url} 
                              alt={match.away_club.name}
                              className="h-8 w-8 object-contain"
                            />
                          )}
                        </div>
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
