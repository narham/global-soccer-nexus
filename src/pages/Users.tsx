import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "@/components/users/UsersTable";
import { RoleRequestsTable } from "@/components/users/RoleRequestsTable";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Users() {
  const { isAdminFederasi, loading } = useUserRole();

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!isAdminFederasi) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
        <p className="text-muted-foreground">
          Kelola pengguna, role, dan persetujuan akses
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Daftar Pengguna</TabsTrigger>
          <TabsTrigger value="requests">Permintaan Role</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengguna</CardTitle>
              <CardDescription>
                Kelola pengguna dan role mereka dalam sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Role</CardTitle>
              <CardDescription>
                Review dan setujui permintaan role dari pengguna
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleRequestsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
