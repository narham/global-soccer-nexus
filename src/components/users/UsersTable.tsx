import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserCog, Plus } from "lucide-react";
import { UserFormDialog } from "./UserFormDialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function UsersTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["users", searchQuery, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*");

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user roles separately
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role, club_id")
        .in("user_id", userIds);

      // Fetch clubs separately
      const clubIds = roles?.filter(r => r.club_id).map(r => r.club_id) || [];
      const { data: clubs } = await supabase
        .from("clubs")
        .select("id, name")
        .in("id", clubIds);

      // Combine data
      let combinedData = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const club = userRole?.club_id ? clubs?.find(c => c.id === userRole.club_id) : null;
        return {
          ...profile,
          user_role: userRole ? {
            ...userRole,
            club_name: club?.name
          } : null
        };
      });

      // Apply role filter
      if (roleFilter !== "all") {
        if (roleFilter === "no_role") {
          combinedData = combinedData?.filter(u => !u.user_role);
        } else {
          combinedData = combinedData?.filter(u => u.user_role?.role === roleFilter);
        }
      }

      return combinedData;
    },
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin_federasi":
        return "destructive";
      case "admin_klub":
        return "default";
      case "panitia":
        return "secondary";
      case "wasit":
        return "outline";
      default:
        return "secondary";
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
        return "Tidak ada role";
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="no_role">Tanpa Role</SelectItem>
            <SelectItem value="admin_federasi">Admin Federasi</SelectItem>
            <SelectItem value="admin_klub">Admin Klub</SelectItem>
            <SelectItem value="panitia">Panitia</SelectItem>
            <SelectItem value="wasit">Wasit</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
      ) : users && users.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Klub</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || "-"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    {user.user_role ? (
                      <Badge variant={getRoleBadgeVariant(user.user_role.role)}>
                        {getRoleLabel(user.user_role.role)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Tidak ada role</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.user_role?.club_name || "-"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada data pengguna
        </div>
      )}

      <UserFormDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
