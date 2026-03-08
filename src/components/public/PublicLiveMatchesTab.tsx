import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Calendar, Radio } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const PublicLiveMatchesTab = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();

    const channel = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchLiveMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          venue,
          status,
          home_club:clubs!home_club_id(id, name, logo_url, short_name),
          away_club:clubs!away_club_id(id, name, logo_url, short_name),
          competition:competitions(id, name)
        `)
        .in("status", ["live", "first_half", "half_time", "second_half"])
        .order("match_date", { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching live matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Radio className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Tidak Ada Pertandingan Live</h3>
          <p className="text-muted-foreground text-center text-sm max-w-sm">
            Saat ini tidak ada pertandingan yang sedang berlangsung. Cek tab Jadwal untuk melihat pertandingan mendatang.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
          <span className="font-bold text-destructive text-sm uppercase tracking-wide">Sedang Berlangsung</span>
        </div>
        <Badge variant="secondary" className="text-xs">{matches.length} Pertandingan</Badge>
      </div>

      {matches.map((match) => (
        <Card key={match.id} className="border-destructive/30 bg-gradient-to-r from-destructive/5 to-transparent overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground truncate">
                {match.competition?.name}
              </span>
              <Badge variant="destructive" className={`text-xs gap-1 ${match.status === "half_time" ? "" : "animate-pulse"}`}>
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
                {match.status === "first_half" ? "BABAK 1" : match.status === "half_time" ? "ISTIRAHAT" : match.status === "second_half" ? "BABAK 2" : "LIVE"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between gap-2">
              {/* Home Team */}
              <Link to={`/public/clubs/${match.home_club?.id}`} className="flex flex-col items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={match.home_club?.logo_url || ""} alt={match.home_club?.name} />
                  <AvatarFallback className="text-xs font-bold">{match.home_club?.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-xs sm:text-sm text-center truncate w-full">
                  {match.home_club?.short_name || match.home_club?.name}
                </span>
              </Link>

              {/* Score */}
              <div className="flex items-center gap-3 sm:gap-5 px-2 sm:px-4">
                <span className="text-3xl sm:text-4xl font-black tabular-nums">{match.home_score ?? 0}</span>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground font-medium">VS</span>
                </div>
                <span className="text-3xl sm:text-4xl font-black tabular-nums">{match.away_score ?? 0}</span>
              </div>

              {/* Away Team */}
              <Link to={`/public/clubs/${match.away_club?.id}`} className="flex flex-col items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={match.away_club?.logo_url || ""} alt={match.away_club?.name} />
                  <AvatarFallback className="text-xs font-bold">{match.away_club?.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-xs sm:text-sm text-center truncate w-full">
                  {match.away_club?.short_name || match.away_club?.name}
                </span>
              </Link>
            </div>

            {match.venue && (
              <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1.5">
                📍 {match.venue}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
