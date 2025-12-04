import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";

export const PublicLiveMatchesTab = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.live'
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
        .eq("status", "live")
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
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tidak Ada Pertandingan Live</h3>
          <p className="text-muted-foreground text-center">
            Saat ini tidak ada pertandingan yang sedang berlangsung
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="font-semibold text-red-500">LIVE</span>
        <Badge variant="secondary">{matches.length} Pertandingan</Badge>
      </div>

      {matches.map((match) => (
        <Card key={match.id} className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {match.competition?.name}
              </CardTitle>
              <Badge variant="destructive" className="animate-pulse">
                🔴 LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {match.home_club?.logo_url && (
                  <img
                    src={match.home_club.logo_url}
                    alt={match.home_club.name}
                    className="w-10 h-10 object-contain"
                  />
                )}
                <span className="font-semibold">
                  {match.home_club?.short_name || match.home_club?.name}
                </span>
              </div>

              <div className="flex items-center gap-4 px-6">
                <span className="text-3xl font-bold">{match.home_score ?? 0}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-3xl font-bold">{match.away_score ?? 0}</span>
              </div>

              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="font-semibold">
                  {match.away_club?.short_name || match.away_club?.name}
                </span>
                {match.away_club?.logo_url && (
                  <img
                    src={match.away_club.logo_url}
                    alt={match.away_club.name}
                    className="w-10 h-10 object-contain"
                  />
                )}
              </div>
            </div>

            {match.venue && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                📍 {match.venue}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};