import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, PauseCircle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchHeader } from "@/components/matches/MatchHeader";
import { MatchLineupTab } from "@/components/matches/MatchLineupTab";
import { MatchEventsTab } from "@/components/matches/MatchEventsTab";
import { MatchStatsTab } from "@/components/matches/MatchStatsTab";
import { MatchOfficialsTab } from "@/components/matches/MatchOfficialsTab";
import { MatchReportTab } from "@/components/matches/MatchReportTab";
import { MatchTicketsTab } from "@/components/tickets/MatchTicketsTab";
import { Badge } from "@/components/ui/badge";

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMatch();
      
      // Setup realtime subscription for match updates
      const channel = supabase
        .channel('match-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${id}`
          },
          () => {
            fetchMatch();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchMatch = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          competition:competitions(name, season, type),
          home_club:clubs!matches_home_club_id_fkey(id, name, logo_url, home_color),
          away_club:clubs!matches_away_club_id_fkey(id, name, logo_url, away_color)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data pertandingan",
        description: error.message,
      });
      navigate("/matches");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: newStatus as any })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status diupdate",
        description: `Pertandingan ${newStatus === "live" ? "dimulai" : newStatus === "finished" ? "selesai" : "dijadwalkan"}`,
      });
      
      fetchMatch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal update status",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!match) return null;

  const canStart = match.status === "scheduled";
  const canFinish = match.status === "live";
  const isLive = match.status === "live";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/matches")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
          {canStart && (
            <Button onClick={() => handleStatusChange("live")}>
              <Play className="mr-2 h-4 w-4" />
              Mulai Pertandingan
            </Button>
          )}
          {canFinish && (
            <Button onClick={() => handleStatusChange("finished")} variant="secondary">
              <CheckCircle className="mr-2 h-4 w-4" />
              Akhiri Pertandingan
            </Button>
          )}
        </div>
      </div>

      <MatchHeader match={match} />

      <Tabs defaultValue="lineup" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="lineup">⚽ Line-up</TabsTrigger>
          <TabsTrigger value="events">📝 Events</TabsTrigger>
          <TabsTrigger value="stats">📊 Statistik</TabsTrigger>
          <TabsTrigger value="officials">👨‍⚖️ Petugas</TabsTrigger>
          <TabsTrigger value="tickets">🎫 Tiket</TabsTrigger>
          <TabsTrigger value="report">📋 Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup">
          <MatchLineupTab matchId={match.id} homeClub={match.home_club} awayClub={match.away_club} />
        </TabsContent>

        <TabsContent value="events">
          <MatchEventsTab matchId={match.id} homeClub={match.home_club} awayClub={match.away_club} />
        </TabsContent>

        <TabsContent value="stats">
          <MatchStatsTab matchId={match.id} homeClub={match.home_club} awayClub={match.away_club} />
        </TabsContent>

        <TabsContent value="officials">
          <MatchOfficialsTab matchId={match.id} />
        </TabsContent>

        <TabsContent value="tickets">
          <MatchTicketsTab matchId={match.id} />
        </TabsContent>

        <TabsContent value="report">
          <MatchReportTab match={match} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MatchDetail;
