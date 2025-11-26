import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatsFormDialog } from "./StatsFormDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MatchStatsTabProps {
  matchId: string;
  homeClub: any;
  awayClub: any;
}

export const MatchStatsTab = ({ matchId, homeClub, awayClub }: MatchStatsTabProps) => {
  const [homeStats, setHomeStats] = useState<any>(null);
  const [awayStats, setAwayStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [selectedStats, setSelectedStats] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_statistics',
          filter: `match_id=eq.${matchId}`
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("match_statistics")
        .select("*")
        .eq("match_id", matchId);

      if (error) throw error;

      setHomeStats(data?.find((s) => s.club_id === homeClub.id) || null);
      setAwayStats(data?.find((s) => s.club_id === awayClub.id) || null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat statistik",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStats = (club: any, stats: any) => {
    setSelectedClub(club);
    setSelectedStats(stats);
    setDialogOpen(true);
  };

  const renderStat = (label: string, homeValue: number, awayValue: number, isPercentage = false) => {
    const total = homeValue + awayValue;
    const homePercent = total > 0 ? (homeValue / total) * 100 : 0;
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 0;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{homeValue}{isPercentage && "%"}</span>
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{awayValue}{isPercentage && "%"}</span>
        </div>
        <div className="flex gap-1 h-2">
          <div
            className="bg-primary rounded-l transition-all"
            style={{ width: `${homePercent}%` }}
          />
          <div
            className="bg-destructive rounded-r transition-all"
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!homeStats && !awayStats) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>
            Belum ada statistik untuk pertandingan ini. Klik tombol di bawah untuk mulai input statistik.
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={() => handleEditStats(homeClub, null)}>
            Input Statistik {homeClub.name}
          </Button>
          <Button onClick={() => handleEditStats(awayClub, null)}>
            Input Statistik {awayClub.name}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Alert className="flex-1">
          <AlertDescription>
            Statistik pertandingan real-time. Data dapat diupdate selama pertandingan berlangsung.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => handleEditStats(homeClub, homeStats)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Stats {homeClub.name}
        </Button>
        <Button variant="outline" onClick={() => handleEditStats(awayClub, awayStats)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Stats {awayClub.name}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistik Pertandingan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {renderStat("Penguasaan Bola", homeStats?.possession || 0, awayStats?.possession || 0, true)}
            {renderStat("Total Shots", homeStats?.shots || 0, awayStats?.shots || 0)}
            {renderStat("Shots On Target", homeStats?.shots_on_target || 0, awayStats?.shots_on_target || 0)}
            {renderStat("Saves", homeStats?.saves || 0, awayStats?.saves || 0)}
          </div>

          <div>
            <h3 className="font-semibold mb-4">Passing</h3>
            <div className="space-y-4">
              {renderStat("Total Passes", homeStats?.passes || 0, awayStats?.passes || 0)}
              {renderStat("Akurasi Passing", homeStats?.pass_accuracy || 0, awayStats?.pass_accuracy || 0, true)}
              {renderStat("Crosses", homeStats?.crosses || 0, awayStats?.crosses || 0)}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Defending</h3>
            <div className="space-y-4">
              {renderStat("Tackles", homeStats?.tackles || 0, awayStats?.tackles || 0)}
              {renderStat("Interceptions", homeStats?.interceptions || 0, awayStats?.interceptions || 0)}
              {renderStat("Clearances", homeStats?.clearances || 0, awayStats?.clearances || 0)}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Lainnya</h3>
            <div className="space-y-4">
              {renderStat("Fouls", homeStats?.fouls || 0, awayStats?.fouls || 0)}
              {renderStat("Corners", homeStats?.corners || 0, awayStats?.corners || 0)}
              {renderStat("Offsides", homeStats?.offsides || 0, awayStats?.offsides || 0)}
              {renderStat("Duels Won", homeStats?.duels_won || 0, awayStats?.duels_won || 0)}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClub && (
        <StatsFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          matchId={matchId}
          clubId={selectedClub.id}
          clubName={selectedClub.name}
          stats={selectedStats}
          onSuccess={fetchStats}
        />
      )}
    </div>
  );
};
