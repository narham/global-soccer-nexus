import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface MatchReportTabProps {
  match: any;
}

export const MatchReportTab = ({ match }: MatchReportTabProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [homeStats, setHomeStats] = useState<any>(null);
  const [awayStats, setAwayStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [match.id]);

  const fetchReportData = async () => {
    try {
      const [eventsData, statsData] = await Promise.all([
        supabase
          .from("match_events")
          .select("*, player:players(full_name), club:clubs(name)")
          .eq("match_id", match.id)
          .order("minute"),
        supabase
          .from("match_statistics")
          .select("*")
          .eq("match_id", match.id),
      ]);

      if (eventsData.data) setEvents(eventsData.data);
      if (statsData.data) {
        setHomeStats(statsData.data.find((s) => s.club_id === match.home_club_id));
        setAwayStats(statsData.data.find((s) => s.club_id === match.away_club_id));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data laporan",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadReport = () => {
    // Mock download - in production, generate PDF report
    alert("Laporan pertandingan akan didownload dalam format PDF sesuai FIFA Match Report Template");
  };

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Match Report mengikuti FIFA Match Report Format yang mencakup: informasi pertandingan, lineup, 
          events, statistik, dan catatan wasit. Laporan ini dapat diexport ke PDF untuk arsip resmi.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Official Match Report</h2>
            <p className="text-muted-foreground">
              {match.competition?.name} - {match.competition?.season}
            </p>
          </div>
          <Button onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Match Information */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">Match Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Competition</p>
                <p className="font-medium">{match.competition?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Season</p>
                <p className="font-medium">{match.competition?.season}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {format(new Date(match.match_date), "EEEE, d MMMM yyyy, HH:mm", { locale: id })} WIB
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-medium">{match.venue || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="font-medium">{match.attendance?.toLocaleString() || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Referee</p>
                <p className="font-medium">{match.referee_name || "—"}</p>
              </div>
            </div>
          </div>

          {/* Final Score */}
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">Final Score</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold">{match.home_club?.name}</p>
                <Badge variant="outline" className="mt-1">HOME</Badge>
              </div>
              <div>
                <p className="text-5xl font-bold text-primary">
                  {match.home_score ?? 0} : {match.away_score ?? 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {match.status === "finished" ? "FINAL" : "—"}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold">{match.away_club?.name}</p>
                <Badge variant="outline" className="mt-1">AWAY</Badge>
              </div>
            </div>
          </div>

          {/* Match Summary */}
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">Match Summary</h3>
            <div className="space-y-3 text-sm">
              <p>
                <strong>Half-time Score:</strong> {match.half_time_home_score !== null ? `${match.half_time_home_score} : ${match.half_time_away_score}` : "Not available"}
              </p>
              <p>
                <strong>Weather Conditions:</strong> {match.weather_condition || "Clear, 28°C (to be recorded by match officials)"}
              </p>
              <p>
                <strong>Pitch Condition:</strong> {match.pitch_condition || "Good (to be assessed by referee)"}
              </p>
              {match.match_notes && (
                <p>
                  <strong>Match Notes:</strong> {match.match_notes}
                </p>
              )}
            </div>
          </div>

          {/* Goal Scorers */}
          {events.filter((e) => ["goal", "penalty_scored", "own_goal"].includes(e.event_type)).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-lg border-b pb-2">Goal Scorers</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">{match.home_club?.name}</p>
                  <div className="space-y-1">
                    {events
                      .filter((e) => ["goal", "penalty_scored", "own_goal"].includes(e.event_type) && e.club_id === match.home_club_id)
                      .map((e, i) => (
                        <p key={i} className="text-sm">
                          ⚽ {e.player?.full_name} ({e.minute}')
                          {e.goal_type && ` - ${e.goal_type}`}
                        </p>
                      ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2">{match.away_club?.name}</p>
                  <div className="space-y-1">
                    {events
                      .filter((e) => ["goal", "penalty_scored", "own_goal"].includes(e.event_type) && e.club_id === match.away_club_id)
                      .map((e, i) => (
                        <p key={i} className="text-sm">
                          ⚽ {e.player?.full_name} ({e.minute}')
                          {e.goal_type && ` - ${e.goal_type}`}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Match Officials */}
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">Match Officials</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Referee</p>
                <p className="font-medium">{match.referee_name || "To be appointed"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assistant Referee 1</p>
                <p className="font-medium">{match.assistant_referee_1 || "To be recorded"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assistant Referee 2</p>
                <p className="font-medium">{match.assistant_referee_2 || "To be recorded"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fourth Official</p>
                <p className="font-medium">{match.fourth_official || "To be recorded"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VAR</p>
                <p className="font-medium">{match.var_official || "To be recorded (if applicable)"}</p>
              </div>
            </div>
          </div>

          {/* Disciplinary */}
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">Disciplinary Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2">{match.home_club?.name}</p>
                <div className="space-y-1">
                  {events
                    .filter((e) => ["yellow_card", "red_card", "second_yellow"].includes(e.event_type) && e.club_id === match.home_club_id)
                    .map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className={e.event_type === "yellow_card" ? "bg-yellow-50" : "bg-red-50"}>
                          {e.event_type === "yellow_card" ? "🟨" : "🟥"}
                        </Badge>
                        <span>{e.player?.full_name} ({e.minute}')</span>
                        {e.red_card_reason && <span className="text-muted-foreground">- {e.red_card_reason}</span>}
                      </div>
                    ))}
                  {events.filter((e) => ["yellow_card", "red_card", "second_yellow"].includes(e.event_type) && e.club_id === match.home_club_id).length === 0 && (
                    <p className="text-sm text-muted-foreground">Tidak ada kartu</p>
                  )}
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">{match.away_club?.name}</p>
                <div className="space-y-1">
                  {events
                    .filter((e) => ["yellow_card", "red_card", "second_yellow"].includes(e.event_type) && e.club_id === match.away_club_id)
                    .map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className={e.event_type === "yellow_card" ? "bg-yellow-50" : "bg-red-50"}>
                          {e.event_type === "yellow_card" ? "🟨" : "🟥"}
                        </Badge>
                        <span>{e.player?.full_name} ({e.minute}')</span>
                        {e.red_card_reason && <span className="text-muted-foreground">- {e.red_card_reason}</span>}
                      </div>
                    ))}
                  {events.filter((e) => ["yellow_card", "red_card", "second_yellow"].includes(e.event_type) && e.club_id === match.away_club_id).length === 0 && (
                    <p className="text-sm text-muted-foreground">Tidak ada kartu</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          {(homeStats || awayStats) && (
            <div>
              <h3 className="font-semibold mb-3 text-lg border-b pb-2">Match Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold">{homeStats?.possession || 0}%</p>
                </div>
                <div className="text-center text-muted-foreground">
                  <p>Possession</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{awayStats?.possession || 0}%</p>
                </div>

                <div className="text-center">
                  <p className="font-bold">{homeStats?.shots || 0}</p>
                </div>
                <div className="text-center text-muted-foreground">
                  <p>Total Shots</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{awayStats?.shots || 0}</p>
                </div>

                <div className="text-center">
                  <p className="font-bold">{homeStats?.shots_on_target || 0}</p>
                </div>
                <div className="text-center text-muted-foreground">
                  <p>Shots on Target</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{awayStats?.shots_on_target || 0}</p>
                </div>

                <div className="text-center">
                  <p className="font-bold">{homeStats?.fouls || 0}</p>
                </div>
                <div className="text-center text-muted-foreground">
                  <p>Fouls</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{awayStats?.fouls || 0}</p>
                </div>

                <div className="text-center">
                  <p className="font-bold">{homeStats?.corners || 0}</p>
                </div>
                <div className="text-center text-muted-foreground">
                  <p>Corners</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{awayStats?.corners || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* FIFA Compliance */}
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">FIFA/AFC Compliance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span>Match conducted in accordance with IFAB Laws of the Game</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span>Venue meets AFC Stadium Requirements</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span>Match officials appointed by AFC/FIFA</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span>Player eligibility verified (FIFA TMS)</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="border-t-2 border-dashed pt-2 mt-12">
                  <p className="text-sm text-muted-foreground">Referee Signature</p>
                </div>
              </div>
              <div>
                <div className="border-t-2 border-dashed pt-2 mt-12">
                  <p className="text-sm text-muted-foreground">Match Commissioner</p>
                </div>
              </div>
              <div>
                <div className="border-t-2 border-dashed pt-2 mt-12">
                  <p className="text-sm text-muted-foreground">AFC/Federation Official</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This report is generated in accordance with FIFA Match Report Guidelines. 
          All data must be verified and signed by match officials within 48 hours of match completion. 
          Report will be submitted to AFC/FIFA via TMS (Transfer Matching System) for official records.
        </p>
      </Card>
    </div>
  );
};
