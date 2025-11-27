import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  FileText, 
  UserPlus, 
  ClipboardList,
  Upload,
  Calendar,
  Plus,
  Zap
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface QuickAccessItem {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  variant?: 'default' | 'secondary' | 'outline';
}

export const QuickAccessBar = () => {
  const { role, clubId } = useUserRole();
  const navigate = useNavigate();
  const [shortcuts, setShortcuts] = useState<QuickAccessItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShortcuts();
  }, [role, clubId]);

  const fetchShortcuts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let items: QuickAccessItem[] = [];

      if (role === "admin_federasi") {
        // Admin Federasi shortcuts
        const [
          { count: pendingCompetitions },
          { count: pendingPlayers },
          { count: pendingRegistrations },
          { count: pendingRoleRequests },
          { count: pendingTransfers }
        ] = await Promise.all([
          supabase.from("competitions").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
          supabase.from("players").select("*", { count: "exact", head: true }).eq("registration_status", "pending"),
          supabase.from("competition_player_registrations").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("role_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("player_transfers").select("*", { count: "exact", head: true }).eq("status", "pending")
        ]);

        items = [
          {
            title: "Kompetisi Review",
            description: "Perlu persetujuan",
            icon: Trophy,
            href: "/competitions",
            badge: pendingCompetitions || 0,
            variant: pendingCompetitions ? 'default' : 'outline'
          },
          {
            title: "Pemain Review",
            description: "Registrasi baru",
            icon: Users,
            href: "/players",
            badge: pendingPlayers || 0,
            variant: pendingPlayers ? 'default' : 'outline'
          },
          {
            title: "Role Request",
            description: "Permintaan role",
            icon: UserPlus,
            href: "/users",
            badge: pendingRoleRequests || 0,
            variant: pendingRoleRequests ? 'default' : 'outline'
          },
          {
            title: "Transfer",
            description: "Pending approval",
            icon: ClipboardList,
            href: "/transfers",
            badge: pendingTransfers || 0,
            variant: pendingTransfers ? 'default' : 'outline'
          },
          {
            title: "Registrasi Pemain",
            description: "Review kompetisi",
            icon: FileText,
            href: "/competitions",
            badge: pendingRegistrations || 0,
            variant: pendingRegistrations ? 'default' : 'outline'
          }
        ];
      } else if (role === "admin_klub" && clubId) {
        // Admin Klub shortcuts
        const [
          { count: clubPlayers },
          { count: clubDocuments }
        ] = await Promise.all([
          supabase.from("players").select("*", { count: "exact", head: true }).eq("current_club_id", clubId),
          supabase.from("club_documents").select("*", { count: "exact", head: true }).eq("club_id", clubId).eq("verified", false)
        ]);

        items = [
          {
            title: "Pemain Klub",
            description: "Kelola pemain",
            icon: Users,
            href: `/clubs/${clubId}/players`,
            badge: clubPlayers || 0,
            variant: 'outline'
          },
          {
            title: "Registrasi Kompetisi",
            description: "Daftar kompetisi",
            icon: Trophy,
            href: `/clubs/${clubId}/competitions`,
            variant: 'outline'
          },
          {
            title: "Upload Dokumen",
            description: "Dokumen klub",
            icon: Upload,
            href: `/clubs/${clubId}/documents`,
            badge: clubDocuments || 0,
            variant: clubDocuments ? 'secondary' : 'outline'
          },
          {
            title: "Pertandingan",
            description: "Jadwal klub",
            icon: Calendar,
            href: `/clubs/${clubId}/matches`,
            variant: 'outline'
          }
        ];
      } else if (role === "panitia") {
        // Panitia shortcuts
        const [
          { data: competitions }
        ] = await Promise.all([
          supabase.from("competitions").select("*").eq("created_by", user.id)
        ]);

        const pending = competitions?.filter(c => c.approval_status === "pending").length || 0;
        const approved = competitions?.filter(c => c.approval_status === "approved").length || 0;

        items = [
          {
            title: "Kompetisi Saya",
            description: `${approved} disetujui`,
            icon: Trophy,
            href: "/panitia/competitions",
            badge: pending,
            variant: pending ? 'default' : 'outline'
          },
          {
            title: "Pertandingan",
            description: "Kelola pertandingan",
            icon: Calendar,
            href: "/panitia/matches",
            variant: 'outline'
          },
          {
            title: "Buat Kompetisi",
            description: "Kompetisi baru",
            icon: Plus,
            href: "/panitia/competitions",
            variant: 'secondary'
          }
        ];
      }

      setShortcuts(items);
    } catch (error) {
      console.error("Error fetching shortcuts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || shortcuts.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Akses Cepat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {shortcuts.map((item, index) => (
            <Button
              key={`${item.href}-${index}`}
              variant={item.variant as any}
              className="h-auto flex-col items-start p-4 relative"
              onClick={() => navigate(item.href)}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <item.icon className="h-5 w-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <div className="text-left w-full">
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
