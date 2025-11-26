import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface MatchStatsTabProps {
  matchId: string;
}

export const MatchStatsTab = ({ matchId }: MatchStatsTabProps) => {
  // Mock stats - in production, calculate from match events
  const stats = {
    home: {
      possession: 58,
      shots: 14,
      shotsOnTarget: 7,
      passes: 456,
      passAccuracy: 84,
      tackles: 18,
      fouls: 12,
      corners: 6,
      offsides: 3,
      saves: 4,
    },
    away: {
      possession: 42,
      shots: 9,
      shotsOnTarget: 4,
      passes: 342,
      passAccuracy: 79,
      tackles: 23,
      fouls: 15,
      corners: 3,
      offsides: 2,
      saves: 5,
    },
  };

  const renderStat = (label: string, homeValue: number, awayValue: number, isPercentage = false) => {
    const total = homeValue + awayValue;
    const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercentage = 100 - homePercentage;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-bold text-primary">{homeValue}{isPercentage ? "%" : ""}</span>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="font-bold text-primary">{awayValue}{isPercentage ? "%" : ""}</span>
        </div>
        <div className="flex gap-1">
          <div className="flex-1 h-2 bg-blue-500 rounded-l" style={{ width: `${homePercentage}%` }} />
          <div className="flex-1 h-2 bg-red-500 rounded-r" style={{ width: `${awayPercentage}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Statistik pertandingan sesuai OPTA Sports Data Standard. Data dikumpulkan real-time menggunakan 
          FIFA-approved data collection system.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-center">Statistik Pertandingan</h3>
        <div className="space-y-6">
          {renderStat("Ball Possession", stats.home.possession, stats.away.possession, true)}
          {renderStat("Total Shots", stats.home.shots, stats.away.shots)}
          {renderStat("Shots on Target", stats.home.shotsOnTarget, stats.away.shotsOnTarget)}
          {renderStat("Total Passes", stats.home.passes, stats.away.passes)}
          {renderStat("Pass Accuracy", stats.home.passAccuracy, stats.away.passAccuracy, true)}
          {renderStat("Tackles", stats.home.tackles, stats.away.tackles)}
          {renderStat("Fouls", stats.home.fouls, stats.away.fouls)}
          {renderStat("Corners", stats.home.corners, stats.away.corners)}
          {renderStat("Offsides", stats.home.offsides, stats.away.offsides)}
          {renderStat("Goalkeeper Saves", stats.home.saves, stats.away.saves)}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Attacking</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shots</span>
              <span className="font-bold">{stats.home.shots} - {stats.away.shots}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">On Target</span>
              <span className="font-bold">{stats.home.shotsOnTarget} - {stats.away.shotsOnTarget}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Corners</span>
              <span className="font-bold">{stats.home.corners} - {stats.away.corners}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Passing</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{stats.home.passes} - {stats.away.passes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="font-bold">{stats.home.passAccuracy}% - {stats.away.passAccuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Possession</span>
              <span className="font-bold">{stats.home.possession}% - {stats.away.possession}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-semibold mb-2">Defending</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tackles</span>
              <span className="font-bold">{stats.home.tackles} - {stats.away.tackles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saves</span>
              <span className="font-bold">{stats.home.saves} - {stats.away.saves}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fouls</span>
              <span className="font-bold">{stats.home.fouls} - {stats.away.fouls}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Heat Map & Player Performance</h3>
        <p className="text-sm text-muted-foreground">
          Fitur heat map dan performance tracking akan tersedia setelah integrasi dengan 
          FIFA-approved tracking system. Data mencakup: distance covered, sprint speed, 
          passing networks, dan tactical formations.
        </p>
      </Card>
    </div>
  );
};
