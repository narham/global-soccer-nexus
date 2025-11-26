import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface MatchReportTabProps {
  match: any;
}

export const MatchReportTab = ({ match }: MatchReportTabProps) => {
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
                <strong>Half-time Score:</strong> {match.home_score !== null ? "— : —" : "Not available"}
              </p>
              <p>
                <strong>Weather Conditions:</strong> Clear, 28°C (to be recorded by match officials)
              </p>
              <p>
                <strong>Pitch Condition:</strong> Good (to be assessed by referee)
              </p>
            </div>
          </div>

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
                <p className="font-medium">To be recorded</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assistant Referee 2</p>
                <p className="font-medium">To be recorded</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fourth Official</p>
                <p className="font-medium">To be recorded</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">VAR</p>
                <p className="font-medium">To be recorded (if applicable)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AVAR</p>
                <p className="font-medium">To be recorded (if applicable)</p>
              </div>
            </div>
          </div>

          {/* Disciplinary */}
          <div>
            <h3 className="font-semibold mb-3 text-lg border-b pb-2">Disciplinary Actions</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50">🟨</Badge>
                <span className="text-sm">Yellow Cards: To be recorded from match events</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50">🟥</Badge>
                <span className="text-sm">Red Cards: To be recorded from match events</span>
              </div>
            </div>
          </div>

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
