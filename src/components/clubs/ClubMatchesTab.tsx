import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClubMatchCard } from "./ClubMatchCard";
import { ClubMatchManageDialog } from "./ClubMatchManageDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface ClubMatchesTabProps {
  clubId: string;
}

export const ClubMatchesTab = ({ clubId }: ClubMatchesTabProps) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialTab, setInitialTab] = useState("lineup");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [competitionFilter, setCompetitionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [competitions, setCompetitions] = useState<any[]>([]);

  useEffect(() => {
    fetchMatches();
    fetchCompetitions();

    // Realtime subscription for matches
    const channel = supabase
      .channel('club-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(id, name, short_name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(id, name, short_name, logo_url),
          competition:competitions(id, name, type),
          match_events(id, event_type),
          match_lineups(id)
        `)
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order("match_date", { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat pertandingan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = (match: any, tab: string = "lineup") => {
    setSelectedMatch(match);
    setInitialTab(tab);
    setDialogOpen(true);
  };

  const filteredMatches = matches.filter((match) => {
    const statusMatch = statusFilter === "all" || match.status === statusFilter;
    const competitionMatch = competitionFilter === "all" || match.competition_id === competitionFilter;
    const searchMatch = searchQuery === "" || 
      match.home_club?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.away_club?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && competitionMatch && searchMatch;
  });

  if (loading) {
    return <div className="text-center py-8">Memuat pertandingan...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Kelola semua pertandingan klub termasuk lineup, events, statistik, dan laporan pertandingan.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari lawan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="scheduled">Dijadwalkan</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="finished">Selesai</SelectItem>
            <SelectItem value="postponed">Ditunda</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter Kompetisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kompetisi</SelectItem>
            {competitions.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                {comp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {matches.length === 0
            ? "Belum ada pertandingan untuk klub ini"
            : "Tidak ada pertandingan yang sesuai dengan filter"}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <ClubMatchCard
              key={match.id}
              match={match}
              clubId={clubId}
              onManage={handleManage}
            />
          ))}
        </div>
      )}

      {selectedMatch && (
        <ClubMatchManageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          match={selectedMatch}
          initialTab={initialTab}
        />
      )}
    </div>
  );
};
