import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompetitionStandingsTabProps {
  competitionId: string;
  format: string;
}

export const CompetitionStandingsTab = ({ competitionId, format }: CompetitionStandingsTabProps) => {
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStandings();
  }, [competitionId]);

  const fetchStandings = async () => {
    try {
      const { data, error } = await supabase
        .from("standings")
        .select(`
          *,
          clubs:club_id (name, logo_url)
        `)
        .eq("competition_id", competitionId)
        .order("group_name", { ascending: true })
        .order("points", { ascending: false })
        .order("goal_difference", { ascending: false })
        .order("goals_for", { ascending: false });

      if (error) throw error;
      setStandings(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat klasemen",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPositionIndicator = (position: number, totalTeams: number) => {
    // AFC Champions League spots (3 tim)
    if (position <= 3) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    // AFC Cup spots (3 tim berikutnya)
    if (position <= 6) {
      return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
    // Relegation zone (3-4 tim terakhir)
    if (position > totalTeams - 4) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getPositionColor = (position: number, totalTeams: number) => {
    if (position <= 3) return "bg-green-50 border-l-4 border-green-600";
    if (position <= 6) return "bg-blue-50 border-l-4 border-blue-600";
    if (position > totalTeams - 4) return "bg-red-50 border-l-4 border-red-600";
    return "";
  };

  const groupedStandings = format === "group_knockout"
    ? standings.reduce((acc: any, standing) => {
        const group = standing.group_name || "Klasemen Umum";
        if (!acc[group]) acc[group] = [];
        acc[group].push(standing);
        return acc;
      }, {})
    : { "Klasemen Liga": standings };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-semibold mb-2">Keterangan:</p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Zona AFC Champions League (Peringkat 1-3)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>Zona AFC Cup (Peringkat 4-6)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span>Zona Degradasi (3-4 tim terakhir)</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {Object.entries(groupedStandings).map(([groupName, groupStandings]: [string, any]) => (
        <Card key={groupName} className="p-6">
          <h3 className="font-semibold mb-4 text-lg">{groupName}</h3>
          {groupStandings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Klasemen belum tersedia. Klasemen akan diupdate otomatis setelah pertandingan selesai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pos</TableHead>
                    <TableHead>Tim</TableHead>
                    <TableHead className="text-center">Main</TableHead>
                    <TableHead className="text-center hidden md:table-cell">M</TableHead>
                    <TableHead className="text-center hidden md:table-cell">S</TableHead>
                    <TableHead className="text-center hidden md:table-cell">K</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">GM</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">GK</TableHead>
                    <TableHead className="text-center">SG</TableHead>
                    <TableHead className="text-center font-bold">Poin</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupStandings.map((standing: any, index: number) => (
                    <TableRow 
                      key={standing.id}
                      className={getPositionColor(index + 1, groupStandings.length)}
                    >
                      <TableCell className="font-bold">{index + 1}</TableCell>
                      <TableCell className="font-medium">{standing.clubs?.name}</TableCell>
                      <TableCell className="text-center">{standing.played || 0}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{standing.won || 0}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{standing.drawn || 0}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{standing.lost || 0}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">{standing.goals_for || 0}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">{standing.goals_against || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {standing.goal_difference > 0 ? "+" : ""}{standing.goal_difference || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg">
                        {standing.points || 0}
                      </TableCell>
                      <TableCell>
                        {getPositionIndicator(index + 1, groupStandings.length)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ))}

      {format === "round_robin" && standings.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Sistem Promosi & Degradasi</h3>
          <div className="space-y-2 text-sm">
            <p>
              <TrendingUp className="inline h-4 w-4 text-green-600 mr-2" />
              <strong>Peringkat 1-3:</strong> Lolos ke AFC Champions League (sesuai ranking AFC negara)
            </p>
            <p>
              <TrendingUp className="inline h-4 w-4 text-blue-600 mr-2" />
              <strong>Peringkat 4-6:</strong> Lolos ke AFC Cup
            </p>
            <p>
              <TrendingDown className="inline h-4 w-4 text-red-600 mr-2" />
              <strong>Peringkat 3-4 terbawah:</strong> Degradasi ke Liga 2
            </p>
            <p className="text-muted-foreground mt-4">
              * Tergantung pada AFC Club Licensing dan ranking negara di AFC
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
