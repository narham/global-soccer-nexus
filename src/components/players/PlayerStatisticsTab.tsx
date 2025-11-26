import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatisticsFormDialog } from "./StatisticsFormDialog";
import { TableActions } from "../TableActions";

interface PlayerStatisticsTabProps {
  playerId: string;
}

export const PlayerStatisticsTab = ({ playerId }: PlayerStatisticsTabProps) => {
  const [statistics, setStatistics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStat, setSelectedStat] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatistics();
  }, [playerId]);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("player_statistics")
        .select("*")
        .eq("player_id", playerId)
        .order("season", { ascending: false });

      if (error) throw error;
      setStatistics(data || []);
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

  const handleDelete = async (stat: any) => {
    try {
      const { error } = await supabase.from("player_statistics").delete().eq("id", stat.id);
      if (error) throw error;
      toast({ title: "Statistik berhasil dihapus" });
      fetchStatistics();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus statistik",
        description: error.message,
      });
    }
  };

  const careerTotals = statistics.reduce(
    (acc, stat) => ({
      matches: acc.matches + (stat.matches_played || 0),
      goals: acc.goals + (stat.goals || 0),
      assists: acc.assists + (stat.assists || 0),
      yellow: acc.yellow + (stat.yellow_cards || 0),
      red: acc.red + (stat.red_cards || 0),
    }),
    { matches: 0, goals: 0, assists: 0, yellow: 0, red: 0 }
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Total Karier</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{careerTotals.matches}</p>
            <p className="text-sm text-muted-foreground">Penampilan</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{careerTotals.goals}</p>
            <p className="text-sm text-muted-foreground">Gol</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{careerTotals.assists}</p>
            <p className="text-sm text-muted-foreground">Assist</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{careerTotals.yellow}</p>
            <p className="text-sm text-muted-foreground">Kartu Kuning</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">{careerTotals.red}</p>
            <p className="text-sm text-muted-foreground">Kartu Merah</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Statistik Per Musim</h3>
          <Button onClick={() => { setSelectedStat(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Statistik
          </Button>
        </div>

        {statistics.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada data statistik</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Musim</TableHead>
                <TableHead>Main</TableHead>
                <TableHead>Menit</TableHead>
                <TableHead>Gol</TableHead>
                <TableHead>Assist</TableHead>
                <TableHead>KK</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statistics.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="font-medium">{stat.season}</TableCell>
                  <TableCell>{stat.matches_played || 0}</TableCell>
                  <TableCell>{stat.minutes_played || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50">
                      {stat.goals || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50">
                      {stat.assists || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50">
                      {stat.yellow_cards || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-50">
                      {stat.red_cards || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableActions
                      onEdit={() => { setSelectedStat(stat); setDialogOpen(true); }}
                      onDelete={() => handleDelete(stat)}
                      itemName={`Statistik ${stat.season}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <StatisticsFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playerId={playerId}
        statistic={selectedStat}
        onSuccess={fetchStatistics}
      />
    </div>
  );
};
