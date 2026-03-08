import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, PauseCircle, CheckCircle, Timer } from "lucide-react";
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
      const updateData: any = { status: newStatus as any };

      // Auto-save half-time score when transitioning to half_time
      if (newStatus === "half_time") {
        updateData.half_time_home_score = match.home_score ?? 0;
        updateData.half_time_away_score = match.away_score ?? 0;
      }

      const { error } = await supabase
        .from("matches")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      const statusMessages: Record<string, string> = {
        first_half: "Babak 1 dimulai",
        half_time: "Babak 1 selesai — Istirahat",
        second_half: "Babak 2 dimulai",
        finished: "Pertandingan selesai",
      };

      toast({
        title: "Status diupdate",
        description: statusMessages[newStatus] || `Status: ${newStatus}`,
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

  const status = match.status;
  const isLive = status === "first_half" || status === "second_half";

  const getPhaseButton = () => {
    switch (status) {
      case "scheduled":
        return (
          <Button onClick={() => handleStatusChange("first_half")}>
            <Play className="mr-2 h-4 w-4" />
            Kick Off Babak 1
          </Button>
        );
      case "first_half":
        return (
          <Button onClick={() => handleStatusChange("half_time")} variant="secondary">
            <PauseCircle className="mr-2 h-4 w-4" />
            Akhiri Babak 1
          </Button>
        );
      case "half_time":
        return (
          <Button onClick={() => handleStatusChange("second_half")}>
            <Play className="mr-2 h-4 w-4" />
            Kick Off Babak 2
          </Button>
        );
      case "second_half":
        return (
          <Button onClick={() => handleStatusChange("finished")} variant="secondary">
            <CheckCircle className="mr-2 h-4 w-4" />
            Akhiri Pertandingan
          </Button>
        );
      default:
        return null;
    }
  };

  const getPhaseBadge = () => {
    switch (status) {
      case "first_half":
        return <Badge variant="destructive" className="animate-pulse">⚽ BABAK 1</Badge>;
      case "half_time":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">☕ ISTIRAHAT</Badge>;
      case "second_half":
        return <Badge variant="destructive" className="animate-pulse">⚽ BABAK 2</Badge>;
      case "live":
        return <Badge variant="destructive" className="animate-pulse">LIVE</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/matches")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        
        <div className="flex items-center gap-2">
          {getPhaseBadge()}
          {getPhaseButton()}
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
