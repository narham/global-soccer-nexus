import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LineupFormDialog } from "./LineupFormDialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserRole } from "@/hooks/useUserRole";

interface MatchLineupTabProps {
  matchId: string;
  homeClub: any;
  awayClub: any;
}

export const MatchLineupTab = ({ matchId, homeClub, awayClub }: MatchLineupTabProps) => {
  const { clubId: userClubId } = useUserRole();
  const [homeLineup, setHomeLineup] = useState<any[]>([]);
  const [awayLineup, setAwayLineup] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [selectedLineup, setSelectedLineup] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLineups();

    const channel = supabase
      .channel('lineup-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_lineups',
          filter: `match_id=eq.${matchId}`
        },
        () => {
          fetchLineups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const fetchLineups = async () => {
    try {
      const { data, error } = await supabase
        .from("match_lineups")
        .select(`
          *,
          player:players(full_name, position, shirt_number)
        `)
        .eq("match_id", matchId)
        .order("position_type", { ascending: false })
        .order("formation_position", { ascending: true });

      if (error) throw error;

      setHomeLineup(data?.filter((l) => l.club_id === homeClub.id) || []);
      setAwayLineup(data?.filter((l) => l.club_id === awayClub.id) || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat lineup",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLineup = (club: any) => {
    setSelectedClub(club);
    setSelectedLineup(null);
    setDialogOpen(true);
  };

  const handleEditLineup = (lineup: any, club: any) => {
    setSelectedClub(club);
    setSelectedLineup(lineup);
    setDialogOpen(true);
  };

  const handleDeleteLineup = async (lineupId: string) => {
    if (!confirm("Yakin ingin menghapus pemain dari lineup?")) return;

    try {
      const { error } = await supabase.from("match_lineups").delete().eq("id", lineupId);
      if (error) throw error;
      toast({ title: "Pemain berhasil dihapus dari lineup" });
      fetchLineups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus lineup",
        description: error.message,
      });
    }
  };

  const renderLineupTable = (lineup: any[], club: any) => {
    const starting = lineup.filter((l) => l.position_type === "starting");
    const bench = lineup.filter((l) => l.position_type === "bench");
    const isOwnTeam = userClubId === club.id;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {club.name}
            {!isOwnTeam && (
              <Badge variant="outline" className="flex items-center gap-1 ml-2">
                <Eye className="h-3 w-3" />
                Hanya Lihat
              </Badge>
            )}
          </CardTitle>
          {isOwnTeam && (
            <Button size="sm" onClick={() => handleAddLineup(club)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pemain
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Starting XI <Badge variant="secondary">{starting.length}/11</Badge>
            </h3>
            {starting.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Pemain</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Menit</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {starting.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.shirt_number}</TableCell>
                      <TableCell className="font-medium">{l.player?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.position}</Badge>
                      </TableCell>
                      <TableCell>{l.rating ? l.rating.toFixed(1) : "-"}</TableCell>
                      <TableCell>{l.minutes_played || 0}</TableCell>
                      <TableCell className="text-right">
                        {isOwnTeam && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditLineup(l, club)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLineup(l.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">Belum ada starting XI</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Cadangan <Badge variant="secondary">{bench.length}</Badge>
            </h3>
            {bench.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Pemain</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Menit</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bench.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.shirt_number}</TableCell>
                      <TableCell className="font-medium">{l.player?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.position}</Badge>
                      </TableCell>
                      <TableCell>{l.rating ? l.rating.toFixed(1) : "-"}</TableCell>
                      <TableCell>{l.minutes_played || 0}</TableCell>
                      <TableCell className="text-right">
                        {isOwnTeam && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditLineup(l, club)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLineup(l.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">Belum ada pemain cadangan</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Kelola lineup starting XI dan cadangan untuk kedua tim. Rating pemain dan menit bermain dapat diinput setelah pertandingan.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderLineupTable(homeLineup, homeClub)}
        {renderLineupTable(awayLineup, awayClub)}
      </div>

      {selectedClub && (
        <LineupFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          matchId={matchId}
          clubId={selectedClub.id}
          clubName={selectedClub.name}
          lineup={selectedLineup}
          onSuccess={fetchLineups}
        />
      )}
    </div>
  );
};
