import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Shuffle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamFormDialog } from "./TeamFormDialog";
import { TableActions } from "../TableActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface CompetitionTeamsTabProps {
  competitionId: string;
  format: string;
}

export const CompetitionTeamsTab = ({ competitionId, format }: CompetitionTeamsTabProps) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, [competitionId]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("competition_teams")
        .select(`
          *,
          clubs:club_id (name, logo_url, city)
        `)
        .eq("competition_id", competitionId)
        .order("seed", { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat peserta",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (team: any) => {
    try {
      const { error } = await supabase.from("competition_teams").delete().eq("id", team.id);
      if (error) throw error;
      toast({ title: "Peserta berhasil dihapus" });
      fetchTeams();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus peserta",
        description: error.message,
      });
    }
  };

  const handleGenerateGroups = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-groups", {
        body: { competitionId },
      });

      if (error) throw error;
      toast({ title: "Grup berhasil dibuat", description: data.message });
      fetchTeams();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal generate grup",
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const groupedTeams = format === "group_knockout" 
    ? teams.reduce((acc: any, team) => {
        const group = team.group_name || "Belum Ditentukan";
        if (!acc[group]) acc[group] = [];
        acc[group].push(team);
        return acc;
      }, {})
    : { "Semua Tim": teams };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Tim Peserta</h3>
            <p className="text-sm text-muted-foreground">
              Total: {teams.length} tim terdaftar
            </p>
          </div>
          <div className="flex gap-2">
            {format === "group_knockout" && teams.length > 0 && (
              <Button 
                variant="secondary" 
                onClick={handleGenerateGroups}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shuffle className="mr-2 h-4 w-4" />
                )}
                Generate Grup
              </Button>
            )}
            <Button onClick={() => { setSelectedTeam(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Peserta
            </Button>
          </div>
        </div>

        {format === "group_knockout" && (
          <Alert className="mb-4">
            <AlertDescription>
              Sistem pembagian grup menggunakan metode seeding sesuai AFC Champions League. 
              Tim akan dibagi berdasarkan peringkat (seed) ke dalam pot yang berbeda.
            </AlertDescription>
          </Alert>
        )}

        {Object.entries(groupedTeams).map(([groupName, groupTeams]: [string, any]) => (
          <div key={groupName} className="mb-6 last:mb-0">
            {format === "group_knockout" && (
              <h4 className="font-semibold mb-3 text-primary">Grup {groupName}</h4>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Seed</TableHead>
                  <TableHead>Tim</TableHead>
                  <TableHead className="hidden md:table-cell">Kota</TableHead>
                  {format === "group_knockout" && (
                    <TableHead className="hidden lg:table-cell">Grup</TableHead>
                  )}
                  <TableHead className="w-12">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Belum ada tim peserta
                    </TableCell>
                  </TableRow>
                ) : (
                  groupTeams.map((team: any) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">
                        {team.seed ? (
                          <Badge variant="outline">#{team.seed}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{team.clubs?.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{team.clubs?.city || "—"}</TableCell>
                      {format === "group_knockout" && (
                        <TableCell className="hidden lg:table-cell">
                          {team.group_name ? (
                            <Badge>Grup {team.group_name}</Badge>
                          ) : (
                            <Badge variant="outline">Belum Ditentukan</Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <TableActions
                          onEdit={() => { setSelectedTeam(team); setDialogOpen(true); }}
                          onDelete={() => handleDelete(team)}
                          itemName={team.clubs?.name}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ))}
      </Card>

      <TeamFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        competitionId={competitionId}
        team={selectedTeam}
        onSuccess={fetchTeams}
      />
    </div>
  );
};
