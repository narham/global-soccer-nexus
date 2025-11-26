import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Shield, Calendar } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleRequestForm } from "@/components/users/RoleRequestForm";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  clubs: number;
  players: number;
  competitions: number;
  matches: number;
}

const Index = () => {
  const { role, clubId, isAdminKlub, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<Stats>({
    clubs: 0,
    players: 0,
    competitions: 0,
    matches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clubsData, playersData, competitionsData, matchesData] = await Promise.all([
          supabase.from("clubs").select("*", { count: "exact", head: true }),
          supabase.from("players").select("*", { count: "exact", head: true }),
          supabase.from("competitions").select("*", { count: "exact", head: true }),
          supabase.from("matches").select("*", { count: "exact", head: true }),
        ]);

        setStats({
          clubs: clubsData.count || 0,
          players: playersData.count || 0,
          competitions: competitionsData.count || 0,
          matches: matchesData.count || 0,
        });
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
    { title: "Total Klub", value: stats.clubs, icon: Shield, color: "text-primary" },
    { title: "Total Pemain", value: stats.players, icon: Users, color: "text-accent" },
    { title: "Kompetisi Aktif", value: stats.competitions, icon: Trophy, color: "text-secondary" },
    { title: "Pertandingan", value: stats.matches, icon: Calendar, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Selamat datang di sistem manajemen sepakbola profesional</p>
      </div>

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="transition-smooth hover:shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-smooth hover:shadow-elegant">
          <CardHeader>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>Platform manajemen sepakbola profesional</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kelola klub, pemain, kompetisi, dan pertandingan dengan sistem terintegrasi yang dirancang untuk federasi sepakbola modern.
            </p>
          </CardContent>
        </Card>

        <Card className="transition-smooth hover:shadow-elegant">
          <CardHeader>
            <CardTitle>Fitur Utama</CardTitle>
            <CardDescription>Manajemen end-to-end</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>✓ Manajemen Klub & Lisensi</li>
              <li>✓ Database Pemain Lengkap</li>
              <li>✓ Sistem Kompetisi & Jadwal</li>
              <li>✓ Statistik Real-time</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="transition-smooth hover:shadow-elegant">
          <CardHeader>
            <CardTitle>Standar Internasional</CardTitle>
            <CardDescription>Mengikuti best practice FIFA & AFC</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sistem ini dirancang mengikuti standar internasional yang digunakan oleh FIFA, UEFA, dan AFC untuk pengelolaan sepakbola profesional.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
