import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClubMatchCard } from "@/components/clubs/ClubMatchCard";

export default function PanitiaMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's approved competitions
      const { data: userCompetitions, error: compError } = await supabase
        .from("competitions")
        .select("*")
        .eq("created_by", user.id)
        .eq("approval_status", "approved");

      if (compError) throw compError;
      setCompetitions(userCompetitions || []);

      if (!userCompetitions || userCompetitions.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch matches for these competitions
      const { data: matchesData, error: matchError } = await supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(id, name, logo_url),
          competition:competitions(id, name)
        `)
        .in("competition_id", userCompetitions.map(c => c.id))
        .order("match_date", { ascending: true });

      if (matchError) throw matchError;
      setMatches(matchesData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data pertandingan",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    const matchesStatus = statusFilter === "all" || match.status === statusFilter;
    const matchesCompetition =
      competitionFilter === "all" || match.competition_id === competitionFilter;
    const matchesSearch =
      match.home_club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.away_club.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesCompetition && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pertandingan</h1>
        <p className="text-muted-foreground">Kelola semua pertandingan di kompetisi Anda</p>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Belum ada kompetisi yang disetujui. Silakan buat kompetisi terlebih dahulu.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Cari pertandingan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:w-1/3"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-1/4">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="scheduled">Terjadwal</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="finished">Selesai</SelectItem>
                <SelectItem value="postponed">Ditunda</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={competitionFilter} onValueChange={setCompetitionFilter}>
              <SelectTrigger className="md:w-1/4">
                <SelectValue placeholder="Kompetisi" />
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">Tidak ada pertandingan ditemukan</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMatches.map((match) => (
                <ClubMatchCard
                  key={match.id}
                  match={match}
                  clubId=""
                  onManage={() => navigate(`/panitia/matches/${match.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
