import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Shield, Calendar, TrendingUp, UserCheck, FileText, Clock } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleRequestForm } from "@/components/users/RoleRequestForm";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickAccessBar } from "@/components/navigation/QuickAccessBar";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subMonths } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Stats {
  clubs: number;
  players: number;
  competitions: number;
  matches: number;
  pendingPlayers: number;
  pendingTransfers: number;
  pendingRoleRequests: number;
}

interface RecentActivity {
  id: string;
  type: 'player' | 'transfer' | 'competition' | 'match';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

const Index = () => {
  const { role, clubId, isAdminKlub, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<Stats>({
    clubs: 0,
    players: 0,
    competitions: 0,
    matches: 0,
    pendingPlayers: 0,
    pendingTransfers: 0,
    pendingRoleRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [transferData, setTransferData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          clubsData, 
          playersData, 
          competitionsData, 
          matchesData,
          pendingPlayersData,
          pendingTransfersData,
          pendingRoleRequestsData
        ] = await Promise.all([
          supabase.from("clubs").select("*", { count: "exact", head: true }),
          supabase.from("players").select("*", { count: "exact", head: true }),
          supabase.from("competitions").select("*", { count: "exact", head: true }),
          supabase.from("matches").select("*", { count: "exact", head: true }),
          supabase.from("players").select("*", { count: "exact", head: true }).eq("registration_status", "pending"),
          supabase.from("player_transfers").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("role_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        ]);

        setStats({
          clubs: clubsData.count || 0,
          players: playersData.count || 0,
          competitions: competitionsData.count || 0,
          matches: matchesData.count || 0,
          pendingPlayers: pendingPlayersData.count || 0,
          pendingTransfers: pendingTransfersData.count || 0,
          pendingRoleRequests: pendingRoleRequestsData.count || 0,
        });

        // Fetch player registration trends (last 6 months)
        const sixMonthsAgo = subMonths(new Date(), 6);
        const { data: playerTrends } = await supabase
          .from("players")
          .select("created_at")
          .gte("created_at", sixMonthsAgo.toISOString());

        // Group by month
        const monthlyData: { [key: string]: number } = {};
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthKey = format(date, "MMM yyyy");
          monthlyData[monthKey] = 0;
        }

        playerTrends?.forEach((player) => {
          const monthKey = format(new Date(player.created_at), "MMM yyyy");
          if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey]++;
          }
        });

        const chartDataFormatted = Object.entries(monthlyData).map(([month, count]) => ({
          month,
          players: count,
        }));
        setChartData(chartDataFormatted);

        // Fetch transfer statistics by type
        const { data: transfers } = await supabase
          .from("player_transfers")
          .select("transfer_type");

        const transferStats: { [key: string]: number } = {};
        transfers?.forEach((t) => {
          transferStats[t.transfer_type] = (transferStats[t.transfer_type] || 0) + 1;
        });

        const transferDataFormatted = Object.entries(transferStats).map(([type, count]) => ({
          name: type === 'permanent' ? 'Permanen' : type === 'loan' ? 'Pinjaman' : 'Lainnya',
          value: count,
        }));
        setTransferData(transferDataFormatted);

        // Fetch recent activities
        const [recentPlayers, recentTransfers, recentCompetitions, recentMatches] = await Promise.all([
          supabase.from("players").select("id, full_name, created_at, registration_status").order("created_at", { ascending: false }).limit(5),
          supabase.from("player_transfers").select("id, created_at, status, player:player_id(full_name)").order("created_at", { ascending: false }).limit(5),
          supabase.from("competitions").select("id, name, created_at, approval_status").order("created_at", { ascending: false }).limit(5),
          supabase.from("matches").select("id, match_date, status, home_club_id, away_club_id").order("created_at", { ascending: false }).limit(5),
        ]);

        // Fetch club names for matches separately
        const matchClubIds = recentMatches.data?.flatMap(m => [m.home_club_id, m.away_club_id]) || [];
        const { data: clubsForMatches } = await supabase
          .from("clubs")
          .select("id, name")
          .in("id", matchClubIds);

        const clubMap = new Map(clubsForMatches?.map(c => [c.id, c.name]));

        const activities: RecentActivity[] = [
          ...(recentPlayers.data?.map(p => ({
            id: p.id,
            type: 'player' as const,
            title: `Pemain Baru: ${p.full_name}`,
            description: `Status: ${p.registration_status}`,
            timestamp: p.created_at,
            status: p.registration_status,
          })) || []),
          ...(recentTransfers.data?.map(t => ({
            id: t.id,
            type: 'transfer' as const,
            title: `Transfer: ${t.player?.full_name || 'Unknown'}`,
            description: `Status: ${t.status}`,
            timestamp: t.created_at,
            status: t.status,
          })) || []),
          ...(recentCompetitions.data?.map(c => ({
            id: c.id,
            type: 'competition' as const,
            title: `Kompetisi: ${c.name}`,
            description: `Status: ${c.approval_status}`,
            timestamp: c.created_at,
            status: c.approval_status,
          })) || []),
          ...(recentMatches.data?.map(m => ({
            id: m.id,
            type: 'match' as const,
            title: `${clubMap.get(m.home_club_id) || 'TBD'} vs ${clubMap.get(m.away_club_id) || 'TBD'}`,
            description: `Status: ${m.status}`,
            timestamp: m.match_date,
            status: m.status,
          })) || []),
        ];

        // Sort by timestamp and take top 10
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities.slice(0, 10));

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If user doesn't have a role, show role request form
  if (!role) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Selamat Datang</h2>
          <p className="text-muted-foreground">
            Untuk mengakses sistem, silakan ajukan permintaan role terlebih dahulu
          </p>
        </div>
        
        <div className="max-w-2xl">
          <RoleRequestForm />
        </div>
      </div>
    );
  }

  // If Admin Klub but no club assigned, show error
  if (isAdminKlub && !clubId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Akun Belum Lengkap</h2>
          <p className="text-muted-foreground">
            Terjadi kesalahan dalam pengaturan akun Anda
          </p>
        </div>
        
        <Card className="max-w-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Klub Belum Ditentukan</CardTitle>
            <CardDescription>
              Akun Anda telah disetujui sebagai Admin Klub, tetapi belum ditugaskan ke klub tertentu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Silakan hubungi Admin Federasi untuk menyelesaikan pengaturan akun Anda dan mendapatkan akses ke klub yang sesuai.
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Langkah selanjutnya:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Hubungi Admin Federasi melalui email atau telepon</li>
                <li>Informasikan User ID Anda untuk verifikasi</li>
                <li>Admin akan menugaskan Anda ke klub yang sesuai</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    { title: "Total Klub", value: stats.clubs, icon: Shield, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Total Pemain", value: stats.players, icon: Users, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Kompetisi Aktif", value: stats.competitions, icon: Trophy, color: "text-secondary", bgColor: "bg-secondary/10" },
    { title: "Pertandingan", value: stats.matches, icon: Calendar, color: "text-chart-1", bgColor: "bg-chart-1/10" },
  ];

  const pendingCards = [
    { title: "Pemain Pending", value: stats.pendingPlayers, icon: UserCheck, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Transfer Pending", value: stats.pendingTransfers, icon: TrendingUp, color: "text-info", bgColor: "bg-info/10" },
    { title: "Role Requests", value: stats.pendingRoleRequests, icon: FileText, color: "text-muted-foreground", bgColor: "bg-muted" },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'live': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'finished': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Selamat datang di sistem manajemen sepakbola profesional</p>
      </div>

      <QuickAccessBar />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.title} className="transition-smooth hover:shadow-elegant border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total terdaftar</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending Approvals */}
          {role === 'admin_federasi' && (
            <div className="grid gap-4 md:grid-cols-3">
              {pendingCards.map((stat) => (
                <Card key={stat.title} className="transition-smooth hover:shadow-elegant border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Menunggu persetujuan
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="transition-smooth hover:shadow-elegant">
              <CardHeader>
                <CardTitle>Tren Registrasi Pemain</CardTitle>
                <CardDescription>6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="players" stroke="hsl(var(--primary))" strokeWidth={2} name="Pemain" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="transition-smooth hover:shadow-elegant">
              <CardHeader>
                <CardTitle>Statistik Transfer</CardTitle>
                <CardDescription>Berdasarkan jenis transfer</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={transferData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {transferData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="transition-smooth hover:shadow-elegant">
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>10 aktivitas terakhir di sistem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada aktivitas</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'player' ? 'bg-primary/10' :
                        activity.type === 'transfer' ? 'bg-accent/10' :
                        activity.type === 'competition' ? 'bg-secondary/10' :
                        'bg-chart-1/10'
                      }`}>
                        {activity.type === 'player' && <Users className="h-4 w-4 text-primary" />}
                        {activity.type === 'transfer' && <TrendingUp className="h-4 w-4 text-accent" />}
                        {activity.type === 'competition' && <Trophy className="h-4 w-4 text-secondary" />}
                        {activity.type === 'match' && <Calendar className="h-4 w-4 text-chart-1" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(activity.timestamp), "dd MMM yyyy, HH:mm")}</p>
                      </div>
                      {activity.status && (
                        <Badge variant="outline" className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Index;
