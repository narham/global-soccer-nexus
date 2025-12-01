import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, UserCog, Calendar, FileText, Trophy, AlertCircle, TrendingUp, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const ClubDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalStaff: 0,
    totalDocuments: 0,
    upcomingMatches: [] as any[],
    recentMatches: [] as any[],
    contractExpiringSoon: 0,
    standings: null as any,
    pendingTransfers: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [playersRes, staffRes, docsRes, matchesRes, standingsRes, transfersRes] = await Promise.all([
          supabase.from("players").select("*", { count: "exact", head: true }).eq("current_club_id", id),
          supabase.from("club_staff").select("*", { count: "exact", head: true }).eq("club_id", id),
          supabase.from("club_documents").select("*", { count: "exact", head: true }).eq("club_id", id),
          supabase
            .from("matches")
            .select(`
              *,
              home_club:clubs!matches_home_club_id_fkey(id, name, short_name, logo_url),
              away_club:clubs!matches_away_club_id_fkey(id, name, short_name, logo_url),
              competition:competitions(name, logo_url)
            `)
            .or(`home_club_id.eq.${id},away_club_id.eq.${id}`)
            .order("match_date", { ascending: false })
            .limit(10),
          supabase
            .from("standings")
            .select(`
              *,
              competition:competitions(name, season)
            `)
            .eq("club_id", id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("player_transfers")
            .select("*", { count: "exact", head: true })
            .or(`from_club_id.eq.${id},to_club_id.eq.${id}`)
            .in("status", ["pending", "pending_club_from", "pending_club_to", "pending_federation"]),
        ]);

        // Count players with expiring contracts (within 6 months)
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        const { count: expiringCount } = await supabase
          .from("players")
          .select("*", { count: "exact", head: true })
          .eq("current_club_id", id)
          .not("contract_end", "is", null)
          .lte("contract_end", sixMonthsFromNow.toISOString().split("T")[0]);

        const now = new Date();
        const upcoming = matchesRes.data?.filter(
          (m) => new Date(m.match_date) >= now && m.status !== "finished"
        ) || [];
        const recent = matchesRes.data?.filter(
          (m) => new Date(m.match_date) < now || m.status === "finished"
        ).slice(0, 5) || [];

        setStats({
          totalPlayers: playersRes.count || 0,
          totalStaff: staffRes.count || 0,
          totalDocuments: docsRes.count || 0,
          upcomingMatches: upcoming,
          recentMatches: recent,
          contractExpiringSoon: expiringCount || 0,
          standings: standingsRes.data,
          pendingTransfers: transfersRes.count || 0,
        });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDashboardData();
    }
  }, [id]);

  const getMatchResult = (match: any) => {
    if (!match.home_score && !match.away_score) return null;
    const isHome = match.home_club_id === id;
    const ourScore = isHome ? match.home_score : match.away_score;
    const theirScore = isHome ? match.away_score : match.home_score;
    
    if (ourScore > theirScore) return "Menang";
    if (ourScore < theirScore) return "Kalah";
    return "Seri";
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    const variants = {
      Menang: "default",
      Kalah: "destructive",
      Seri: "secondary",
    };
    return <Badge variant={variants[result as keyof typeof variants] as any}>{result}</Badge>;
  };

  if (loading) {
    return <div className="space-y-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Klub</h2>
        <p className="text-muted-foreground">Ringkasan dan statistik klub</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clubs/${id}/players`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemain</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Pemain terdaftar aktif</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clubs/${id}/staff`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staf</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Pelatih dan staf</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clubs/${id}/matches`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pertandingan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingMatches.length}</div>
            <p className="text-xs text-muted-foreground">Pertandingan akan datang</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clubs/${id}/documents`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Dokumen klub</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.contractExpiringSoon > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{stats.contractExpiringSoon} pemain</strong> memiliki kontrak yang akan berakhir dalam 6 bulan.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/clubs/${id}/players`)}>
              Lihat detail
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {stats.pendingTransfers > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{stats.pendingTransfers} transfer</strong> menunggu persetujuan.{" "}
            <Button variant="link" className="p-0 h-auto text-amber-600" onClick={() => navigate(`/transfers`)}>
              Lihat transfer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Standings */}
        {stats.standings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Klasemen Terbaru
              </CardTitle>
              <CardDescription>
                {stats.standings.competition?.name} - {stats.standings.competition?.season}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Posisi</p>
                  <p className="text-2xl font-bold">{stats.standings.position}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Poin</p>
                  <p className="text-2xl font-bold">{stats.standings.points}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm pt-4 border-t">
                <div>
                  <p className="text-muted-foreground text-xs">Main</p>
                  <p className="font-semibold">{stats.standings.played}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Menang</p>
                  <p className="font-semibold text-green-600">{stats.standings.won}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Seri</p>
                  <p className="font-semibold text-yellow-600">{stats.standings.drawn}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Kalah</p>
                  <p className="font-semibold text-red-600">{stats.standings.lost}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gol</span>
                  <span className="font-semibold">{stats.standings.goals_for} - {stats.standings.goals_against}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selisih Gol</span>
                  <span className="font-semibold">{stats.standings.goal_difference}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hasil Pertandingan Terakhir
            </CardTitle>
            <CardDescription>5 pertandingan terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada pertandingan</p>
            ) : (
              <div className="space-y-3">
                {stats.recentMatches.map((match) => {
                  const isHome = match.home_club_id === id;
                  const opponent = isHome ? match.away_club : match.home_club;
                  const result = getMatchResult(match);

                  return (
                    <div
                      key={match.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(`/clubs/${id}/matches/${match.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {isHome ? "vs" : "@"} {opponent.short_name || opponent.name}
                          </span>
                          {result && getResultBadge(result)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(match.match_date), "dd MMM yyyy", { locale: localeId })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {isHome ? match.home_score : match.away_score} - {isHome ? match.away_score : match.home_score}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Matches */}
      {stats.upcomingMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pertandingan Akan Datang
            </CardTitle>
            <CardDescription>Jadwal pertandingan mendatang</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingMatches.map((match) => {
                const isHome = match.home_club_id === id;
                const opponent = isHome ? match.away_club : match.home_club;

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/clubs/${id}/matches/${match.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {opponent.logo_url && (
                        <img src={opponent.logo_url} alt={opponent.name} className="w-8 h-8 object-contain" />
                      )}
                      <div>
                        <p className="font-medium">
                          {isHome ? "vs" : "@"} {opponent.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{match.competition?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {format(new Date(match.match_date), "dd MMM yyyy", { locale: localeId })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.venue || "TBD"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
          <CardDescription>Navigasi cepat ke halaman penting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" onClick={() => navigate(`/clubs/${id}/players`)}>
              <Users className="mr-2 h-4 w-4" />
              Kelola Pemain
            </Button>
            <Button variant="outline" onClick={() => navigate(`/clubs/${id}/staff`)}>
              <UserCog className="mr-2 h-4 w-4" />
              Kelola Staf
            </Button>
            <Button variant="outline" onClick={() => navigate(`/clubs/${id}/matches`)}>
              <Calendar className="mr-2 h-4 w-4" />
              Lihat Pertandingan
            </Button>
            <Button variant="outline" onClick={() => navigate(`/clubs/${id}/documents`)}>
              <FileText className="mr-2 h-4 w-4" />
              Kelola Dokumen
            </Button>
            <Button variant="outline" onClick={() => navigate(`/clubs/${id}/info`)}>
              <Info className="mr-2 h-4 w-4" />
              Edit Info Klub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubDashboard;
