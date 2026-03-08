import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, PauseCircle, CheckCircle, Timer, Swords, Target } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEndChoiceDialog, setShowEndChoiceDialog] = useState(false);
  const [showPenaltyDialog, setShowPenaltyDialog] = useState(false);
  const [penaltyHome, setPenaltyHome] = useState(0);
  const [penaltyAway, setPenaltyAway] = useState(0);

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

  const handleStatusChange = async (newStatus: string, extraData?: Record<string, any>) => {
    try {
      const updateData: any = { status: newStatus as any, ...extraData };

      // Auto-save half-time score when transitioning to half_time
      if (newStatus === "half_time") {
        updateData.half_time_home_score = match.home_score ?? 0;
        updateData.half_time_away_score = match.away_score ?? 0;
      }

      // Auto-save extra time score when transitioning to penalty or finished from ET
      if (newStatus === "penalty_shootout" || (newStatus === "finished" && match.status === "extra_second_half")) {
        updateData.extra_time_home_score = match.home_score ?? 0;
        updateData.extra_time_away_score = match.away_score ?? 0;
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
        extra_first_half: "Perpanjangan Waktu Babak 1 dimulai",
        extra_half_time: "Perpanjangan Babak 1 selesai — Istirahat",
        extra_second_half: "Perpanjangan Waktu Babak 2 dimulai",
        penalty_shootout: "Adu Penalti dimulai",
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

  const handleFinishWithPenalty = async () => {
    await handleStatusChange("finished", {
      penalty_home_score: penaltyHome,
      penalty_away_score: penaltyAway,
    });
    setShowPenaltyDialog(false);
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
  const isLive = ["first_half", "second_half", "extra_first_half", "extra_second_half", "penalty_shootout"].includes(status);

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
          <div className="flex items-center gap-2">
            <Button onClick={() => handleStatusChange("finished")} variant="secondary">
              <CheckCircle className="mr-2 h-4 w-4" />
              Akhiri Pertandingan
            </Button>
            <Button onClick={() => setShowEndChoiceDialog(true)} variant="outline">
              <Swords className="mr-2 h-4 w-4" />
              Perpanjangan Waktu
            </Button>
          </div>
        );
      case "extra_first_half":
        return (
          <Button onClick={() => handleStatusChange("extra_half_time")} variant="secondary">
            <PauseCircle className="mr-2 h-4 w-4" />
            Akhiri Perpanjangan Babak 1
          </Button>
        );
      case "extra_half_time":
        return (
          <Button onClick={() => handleStatusChange("extra_second_half")}>
            <Play className="mr-2 h-4 w-4" />
            Kick Off Perpanjangan Babak 2
          </Button>
        );
      case "extra_second_half":
        return (
          <div className="flex items-center gap-2">
            <Button onClick={() => handleStatusChange("finished")} variant="secondary">
              <CheckCircle className="mr-2 h-4 w-4" />
              Akhiri Pertandingan
            </Button>
            <Button onClick={() => {
              setPenaltyHome(0);
              setPenaltyAway(0);
              setShowPenaltyDialog(true);
            }} variant="outline">
              <Target className="mr-2 h-4 w-4" />
              Adu Penalti
            </Button>
          </div>
        );
      case "penalty_shootout":
        return (
          <Button onClick={() => {
            setPenaltyHome(0);
            setPenaltyAway(0);
            setShowPenaltyDialog(true);
          }} variant="secondary">
            <CheckCircle className="mr-2 h-4 w-4" />
            Akhiri Adu Penalti
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
      case "extra_first_half":
        return <Badge variant="destructive" className="animate-pulse">⏱️ ET BABAK 1</Badge>;
      case "extra_half_time":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">☕ ISTIRAHAT ET</Badge>;
      case "extra_second_half":
        return <Badge variant="destructive" className="animate-pulse">⏱️ ET BABAK 2</Badge>;
      case "penalty_shootout":
        return <Badge variant="destructive" className="animate-pulse">🎯 ADU PENALTI</Badge>;
      case "live":
        return <Badge variant="destructive" className="animate-pulse">LIVE</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" onClick={() => navigate("/matches")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Extra Time Confirmation Dialog */}
      <AlertDialog open={showEndChoiceDialog} onOpenChange={setShowEndChoiceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masuk Perpanjangan Waktu?</AlertDialogTitle>
            <AlertDialogDescription>
              Pertandingan akan dilanjutkan ke perpanjangan waktu (Extra Time). 
              Skor saat ini ({match.home_score ?? 0} - {match.away_score ?? 0}) akan tercatat sebagai skor 90 menit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowEndChoiceDialog(false);
              handleStatusChange("extra_first_half");
            }}>
              Mulai Extra Time
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Penalty Shootout Score Dialog */}
      <AlertDialog open={showPenaltyDialog} onOpenChange={setShowPenaltyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {status === "penalty_shootout" ? "Hasil Adu Penalti" : "Mulai Adu Penalti"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {status === "penalty_shootout" 
                ? "Masukkan skor akhir adu penalti untuk mengakhiri pertandingan."
                : "Pertandingan akan dilanjutkan ke adu penalti (Penalty Shootout)."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid grid-cols-3 gap-4 py-4 items-center">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">{match.home_club?.name}</p>
              <input
                type="number"
                min="0"
                max="20"
                value={penaltyHome}
                onChange={(e) => setPenaltyHome(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 mx-auto text-center text-2xl font-bold border rounded-md p-2 bg-background"
              />
            </div>
            <div className="text-center text-muted-foreground font-bold text-xl">-</div>
            <div className="text-center">
              <p className="text-sm font-medium mb-2">{match.away_club?.name}</p>
              <input
                type="number"
                min="0"
                max="20"
                value={penaltyAway}
                onChange={(e) => setPenaltyAway(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 mx-auto text-center text-2xl font-bold border rounded-md p-2 bg-background"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            {status === "penalty_shootout" ? (
              <AlertDialogAction 
                onClick={handleFinishWithPenalty}
                disabled={penaltyHome === penaltyAway}
              >
                Akhiri Pertandingan
              </AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={() => {
                setShowPenaltyDialog(false);
                handleStatusChange("penalty_shootout");
              }}>
                Mulai Adu Penalti
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MatchDetail;