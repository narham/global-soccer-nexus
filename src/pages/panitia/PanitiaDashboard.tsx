import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { QuickAccessBar } from "@/components/navigation/QuickAccessBar";

export default function PanitiaDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompetitions: 0,
    pendingApproval: 0,
    approvedCompetitions: 0,
    totalMatches: 0,
  });
  const [todayMatches, setTodayMatches] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch competitions stats
      const { data: competitions } = await supabase
        .from("competitions")
        .select("*")
        .eq("created_by", user.id);

      const pending = competitions?.filter(c => c.approval_status === "pending").length || 0;
      const approved = competitions?.filter(c => c.approval_status === "approved").length || 0;

      // Fetch matches count
      const { count: matchesCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .in(
          "competition_id",
          competitions?.filter(c => c.approval_status === "approved").map(c => c.id) || []
        );

      // Fetch today's matches
      const today = new Date().toISOString().split("T")[0];
      const { data: matches } = await supabase
        .from("matches")
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
          away_club:clubs!matches_away_club_id_fkey(id, name, logo_url),
          competition:competitions(id, name)
        `)
        .in(
          "competition_id",
          competitions?.filter(c => c.approval_status === "approved").map(c => c.id) || []
        )
        .gte("match_date", `${today}T00:00:00`)
        .lte("match_date", `${today}T23:59:59`)
        .order("match_date", { ascending: true })
        .limit(5);

      setStats({
        totalCompetitions: competitions?.length || 0,
        pendingApproval: pending,
        approvedCompetitions: approved,
        totalMatches: matchesCount || 0,
      });
      setTodayMatches(matches || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Panitia</h1>
        <p className="text-muted-foreground">Kelola kompetisi dan pertandingan Anda</p>
      </div>

      <QuickAccessBar />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kompetisi</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompetitions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCompetitions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pertandingan</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pertandingan Hari Ini</CardTitle>
          <CardDescription>
            {todayMatches.length === 0
              ? "Tidak ada pertandingan hari ini"
              : `${todayMatches.length} pertandingan dijadwalkan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">
                    {format(new Date(match.match_date), "HH:mm")}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{match.home_club.name}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium">{match.away_club.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {match.competition.name}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/panitia/matches/${match.id}`)}
                >
                  Kelola
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={() => navigate("/panitia/competitions")}>
          <Trophy className="mr-2 h-4 w-4" />
          Kelola Kompetisi
        </Button>
        <Button variant="outline" onClick={() => navigate("/panitia/matches")}>
          <Calendar className="mr-2 h-4 w-4" />
          Lihat Semua Pertandingan
        </Button>
      </div>
    </div>
  );
}
