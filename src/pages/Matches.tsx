import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          competition:competitions(name, type),
          home_club:clubs!matches_home_club_id_fkey(name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(name, logo_url)
        `)
        .order("match_date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat jadwal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match =>
    match.home_club?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.away_club?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.competition?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "destructive";
      case "finished": return "default";
      case "scheduled": return "secondary";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live": return "LIVE";
      case "finished": return "Selesai";
      case "scheduled": return "Dijadwalkan";
      case "postponed": return "Ditunda";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Jadwal Pertandingan</h2>
        <p className="text-muted-foreground">Kelola jadwal dan hasil pertandingan</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pertandingan..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : filteredMatches.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "Tidak ada pertandingan ditemukan" : "Belum ada jadwal pertandingan"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <Card 
              key={match.id} 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/matches/${match.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{match.competition?.name}</Badge>
                  {match.matchday && <Badge variant="outline">MD {match.matchday}</Badge>}
                </div>
                <Badge variant={getStatusColor(match.status || "scheduled")}>
                  {getStatusLabel(match.status || "scheduled")}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Home Team */}
                <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
                    <p className="font-bold text-lg">{match.home_club?.name}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {match.home_club?.logo_url ? (
                      <img src={match.home_club.logo_url} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xs font-bold">{match.home_club?.name?.substring(0, 3)}</span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {match.home_score ?? "—"} : {match.away_score ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(match.match_date), "d MMM, HH:mm", { locale: id })}
                  </p>
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-start gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {match.away_club?.logo_url ? (
                      <img src={match.away_club.logo_url} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-xs font-bold">{match.away_club?.name?.substring(0, 3)}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{match.away_club?.name}</p>
                  </div>
                </div>
              </div>

              {match.venue && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  📍 {match.venue}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;
