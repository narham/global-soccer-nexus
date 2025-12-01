import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ProfileRoleStatusTabProps {
  userId: string;
}

interface RoleRequest {
  id: string;
  requested_role: string;
  status: string;
  reason: string | null;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  requested_club_id: string | null;
  clubs?: {
    name: string;
  };
}

interface UserRole {
  role: string;
  club_id: string | null;
  clubs?: {
    name: string;
  };
}

export const ProfileRoleStatusTab = ({ userId }: ProfileRoleStatusTabProps) => {
  const { toast } = useToast();
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [currentRoles, setCurrentRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch role requests
      const { data: requests, error: requestsError } = await supabase
        .from("role_requests")
        .select(`
          *,
          clubs:requested_club_id(name)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch current roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role, club_id")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      // Fetch club names for roles with club_id
      const rolesWithClubs = await Promise.all(
        (roles || []).map(async (role) => {
          if (role.club_id) {
            const { data: club } = await supabase
              .from("clubs")
              .select("name")
              .eq("id", role.club_id)
              .single();
            return { ...role, clubs: club };
          }
          return role;
        })
      );

      setRoleRequests(requests || []);
      setCurrentRoles(rolesWithClubs);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data role",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu
          </Badge>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin_federasi: "Admin Federasi",
      admin_klub: "Admin Klub",
      panitia: "Panitia",
      wasit: "Wasit",
    };
    return labels[role] || role;
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data role...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Role Aktif</h3>
        {currentRoles.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              Anda belum memiliki role aktif
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {currentRoles.map((role, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <h4 className="font-medium">{getRoleLabel(role.role)}</h4>
                    {role.clubs && (
                      <p className="text-sm text-muted-foreground">
                        Klub: {role.clubs.name}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-green-500">Aktif</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Riwayat Permintaan Role</h3>
        {roleRequests.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              Belum ada permintaan role yang diajukan
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {roleRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {getRoleLabel(request.requested_role)}
                      </h4>
                      {request.clubs && (
                        <p className="text-sm text-muted-foreground">
                          Klub: {request.clubs.name}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Alasan: </span>
                      <span className="text-muted-foreground">
                        {request.reason}
                      </span>
                    </div>
                  )}

                  {request.reviewer_notes && (
                    <div className="text-sm p-3 bg-muted rounded-md">
                      <span className="font-medium">Catatan Admin: </span>
                      <span>{request.reviewer_notes}</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Diajukan:{" "}
                    {format(new Date(request.created_at), "dd MMMM yyyy HH:mm", {
                      locale: localeId,
                    })}
                    {request.reviewed_at && (
                      <>
                        {" | "}
                        Diproses:{" "}
                        {format(new Date(request.reviewed_at), "dd MMMM yyyy HH:mm", {
                          locale: localeId,
                        })}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
