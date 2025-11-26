import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { MatchFormDialog } from "./MatchFormDialog";
import { TableActions } from "../TableActions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompetitionMatchesTabProps {
  competitionId: string;
}

export const CompetitionMatchesTab = ({ competitionId }: CompetitionMatchesTabProps) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
  }, [competitionId]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(name, logo_url)
        `)
        .eq("competition_id", competitionId)
        .order("match_date", { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat jadwal",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (match: any) => {
    try {
      const { error } = await supabase.from("matches").delete().eq("id", match.id);
      if (error) throw error;
      toast({ title: "Pertandingan berhasil dihapus" });
      fetchMatches();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus pertandingan",
        description: error.message,
      });
    }
  };

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-schedule", {
        body: { competitionId },
      });

      if (error) throw error;
      toast({ title: "Jadwal berhasil dibuat", description: data.message });
      fetchMatches();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal generate jadwal",
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "secondary";
      case "live": return "destructive";
      case "finished": return "default";
      case "postponed": return "outline";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Dijadwalkan";
      case "live": return "Live";
      case "finished": return "Selesai";
      case "postponed": return "Ditunda";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Jadwal Pertandingan</h3>
            <p className="text-sm text-muted-foreground">
              Total: {matches.length} pertandingan
            </p>
          </div>
          <div className="flex gap-2">
            {matches.length === 0 && (
              <Button 
                variant="secondary" 
                onClick={handleGenerateSchedule}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarIcon className="mr-2 h-4 w-4" />
                )}
                Generate Jadwal
              </Button>
            )}
            <Button onClick={() => { setSelectedMatch(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pertandingan
            </Button>
          </div>
        </div>

        <Alert className="mb-4">
          <AlertDescription>
            Penjadwalan mengikuti AFC Match Regulations: minimum 3 hari antar pertandingan, 
            kickoff time mengikuti zona waktu setempat, dan venue approval sesuai AFC Stadium Requirements.
          </AlertDescription>
        </Alert>

        {matches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada jadwal pertandingan. Generate jadwal otomatis atau tambah manual.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">MD</TableHead>
                <TableHead>Tanggal & Waktu</TableHead>
                <TableHead>Pertandingan</TableHead>
                <TableHead className="hidden md:table-cell">Venue</TableHead>
                <TableHead className="hidden lg:table-cell">Wasit</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell className="font-medium">{match.matchday || "—"}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {format(new Date(match.match_date), "d MMM yyyy", { locale: id })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(match.match_date), "HH:mm", { locale: id })} WIB
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{match.home_club?.name} vs {match.away_club?.name}</p>
                      {match.group_name && (
                        <Badge variant="outline" className="text-xs">Grup {match.group_name}</Badge>
                      )}
                      {match.round && (
                        <Badge variant="outline" className="text-xs">{match.round}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{match.venue || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{match.referee_name || "—"}</TableCell>
                  <TableCell className="text-center">
                    {match.status === "finished" ? (
                      <span className="font-bold">{match.home_score} - {match.away_score}</span>
                    ) : (
                      <span className="text-muted-foreground">— : —</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(match.status || "scheduled")}>
                      {getStatusLabel(match.status || "scheduled")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableActions
                      onEdit={() => { setSelectedMatch(match); setDialogOpen(true); }}
                      onDelete={() => handleDelete(match)}
                      itemName={`${match.home_club?.name} vs ${match.away_club?.name}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <MatchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        competitionId={competitionId}
        match={selectedMatch}
        onSuccess={fetchMatches}
      />
    </div>
  );
};
