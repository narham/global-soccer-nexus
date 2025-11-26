import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, ShirtIcon } from "lucide-react";

interface MatchLineupTabProps {
  matchId: string;
  homeClub: any;
  awayClub: any;
}

export const MatchLineupTab = ({ matchId, homeClub, awayClub }: MatchLineupTabProps) => {
  // Mock lineup data - in production, fetch from database
  const homeLineup = {
    formation: "4-3-3",
    starting: [
      { position: "GK", number: 1, name: "Nadeo Argawinata", rating: 7.2 },
      { position: "RB", number: 2, name: "Kevin Diks", rating: 7.5 },
      { position: "CB", number: 4, name: "Muhammad Ferarri", rating: 7.8 },
      { position: "CB", number: 5, name: "Rizky Ridho", rating: 7.4 },
      { position: "LB", number: 3, name: "Player 4", rating: 7.0 },
      { position: "CM", number: 6, name: "Rachmat Irianto", rating: 8.0 },
      { position: "CM", number: 8, name: "Marc Klok", rating: 8.2 },
      { position: "CM", number: 10, name: "Beckham Putra", rating: 7.6 },
      { position: "RW", number: 7, name: "Witan Sulaeman", rating: 7.8 },
      { position: "ST", number: 9, name: "Ciro Alves", rating: 8.5 },
      { position: "LW", number: 11, name: "Ricky Kambuaya", rating: 8.1 },
    ],
    bench: [
      { number: 12, name: "Reserve GK", position: "GK" },
      { number: 13, name: "Reserve DF", position: "DF" },
      { number: 14, name: "Reserve MF", position: "MF" },
      { number: 15, name: "Reserve FW", position: "FW" },
    ],
  };

  const awayLineup = {
    formation: "4-4-2",
    starting: [
      { position: "GK", number: 1, name: "Away GK", rating: 7.0 },
      { position: "RB", number: 2, name: "Away RB", rating: 6.8 },
      { position: "CB", number: 4, name: "Away CB1", rating: 7.2 },
      { position: "CB", number: 5, name: "Away CB2", rating: 7.1 },
      { position: "LB", number: 3, name: "Away LB", rating: 6.9 },
      { position: "RM", number: 7, name: "Away RM", rating: 7.3 },
      { position: "CM", number: 6, name: "Away CM1", rating: 7.4 },
      { position: "CM", number: 8, name: "Away CM2", rating: 7.2 },
      { position: "LM", number: 11, name: "Away LM", rating: 7.1 },
      { position: "ST", number: 9, name: "Away ST1", rating: 7.5 },
      { position: "ST", number: 10, name: "Away ST2", rating: 7.6 },
    ],
    bench: [
      { number: 12, name: "Away Reserve GK", position: "GK" },
      { number: 13, name: "Away Reserve DF", position: "DF" },
      { number: 14, name: "Away Reserve MF", position: "MF" },
      { number: 15, name: "Away Reserve FW", position: "FW" },
    ],
  };

  const renderFormation = (lineup: any, isHome: boolean) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{isHome ? homeClub.name : awayClub.name}</h3>
        <Badge variant="outline">{lineup.formation}</Badge>
      </div>

      {/* Starting XI */}
      <div className="bg-gradient-to-b from-green-500/10 to-green-700/10 rounded-lg p-6 min-h-[400px] relative border-2 border-green-500/20">
        <div className="absolute inset-0 bg-[url('/field-lines.svg')] bg-center bg-no-repeat opacity-20" />
        
        <div className="relative space-y-6">
          {/* Forward line */}
          <div className="flex justify-center gap-8">
            {lineup.starting.filter((p: any) => ["ST", "CF", "RW", "LW"].includes(p.position)).map((player: any) => (
              <div key={player.number} className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: isHome ? homeClub.home_color : awayClub.away_color }}
                >
                  {player.number}
                </div>
                <p className="text-xs font-medium mt-1 text-center max-w-[80px]">{player.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{player.rating}</Badge>
              </div>
            ))}
          </div>

          {/* Midfield */}
          <div className="flex justify-center gap-6">
            {lineup.starting.filter((p: any) => ["CM", "RM", "LM", "CAM", "CDM"].includes(p.position)).map((player: any) => (
              <div key={player.number} className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: isHome ? homeClub.home_color : awayClub.away_color }}
                >
                  {player.number}
                </div>
                <p className="text-xs font-medium mt-1 text-center max-w-[80px]">{player.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{player.rating}</Badge>
              </div>
            ))}
          </div>

          {/* Defense */}
          <div className="flex justify-center gap-4">
            {lineup.starting.filter((p: any) => ["RB", "CB", "LB", "RWB", "LWB"].includes(p.position)).map((player: any) => (
              <div key={player.number} className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: isHome ? homeClub.home_color : awayClub.away_color }}
                >
                  {player.number}
                </div>
                <p className="text-xs font-medium mt-1 text-center max-w-[80px]">{player.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{player.rating}</Badge>
              </div>
            ))}
          </div>

          {/* Goalkeeper */}
          <div className="flex justify-center">
            {lineup.starting.filter((p: any) => p.position === "GK").map((player: any) => (
              <div key={player.number} className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: isHome ? homeClub.home_color : awayClub.away_color }}
                >
                  {player.number}
                </div>
                <p className="text-xs font-medium mt-1 text-center max-w-[80px]">{player.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{player.rating}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <ShirtIcon className="h-4 w-4" />
          Pemain Cadangan
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {lineup.bench.map((player: any) => (
            <div key={player.number} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
              <Badge variant="outline">{player.number}</Badge>
              <div>
                <p className="text-sm font-medium">{player.name}</p>
                <p className="text-xs text-muted-foreground">{player.position}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Line-up sesuai FIFA Match Protocol. Starting XI maksimal, 7 pemain cadangan (termasuk 3 GK untuk kompetisi AFC).
          Rating pemain berdasarkan performa dalam pertandingan ini.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          {renderFormation(homeLineup, true)}
        </Card>

        <Card className="p-6">
          {renderFormation(awayLineup, false)}
        </Card>
      </div>
    </div>
  );
};
