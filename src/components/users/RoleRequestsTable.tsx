import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import { RoleRequestDialog } from "./RoleRequestDialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function RoleRequestsTable() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ["role-requests"],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from("role_requests")
        .select(`
          *,
          clubs (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = requestsData?.map(r => r.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .in("id", userIds);

      // Combine requests with profiles
      return requestsData?.map(request => ({
        ...request,
        profile: profiles?.find(p => p.id === request.user_id)
      }));
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return status;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin_federasi":
        return "Admin Federasi";
      case "admin_klub":
        return "Admin Klub";
      case "panitia":
        return "Panitia";
      case "wasit":
        return "Wasit";
      default:
        return role;
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
      ) : requests && requests.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pemohon</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Role Diminta</TableHead>
                <TableHead>Klub</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request.profile?.full_name || "-"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.profile?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.profile?.phone || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getRoleLabel(request.requested_role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.clubs?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.created_at), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada permintaan role
        </div>
      )}

      <RoleRequestDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
