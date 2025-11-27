import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClubsTable } from "@/components/ClubsTable";
import { ClubFormDialog } from "@/components/clubs/ClubFormDialog";
import { DataImportDialog } from "@/components/import/DataImportDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PendingClubsTable } from "@/components/clubs/PendingClubsTable";

interface Club {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  founded_year: number | null;
  license_status: string | null;
  stadium_name: string | null;
  created_at: string;
}

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pendingClubs, setPendingClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();
  const { isAdminKlub, isAdminFederasi, clubId, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect Admin Klub to their club detail page
    if (!roleLoading && isAdminKlub && clubId) {
      navigate(`/clubs/${clubId}`);
    }
  }, [isAdminKlub, clubId, roleLoading, navigate]);

  useEffect(() => {
    fetchClubs();
    if (isAdminFederasi) {
      fetchPendingClubs();
    }
  }, [isAdminFederasi]);

  const fetchClubs = async () => {
    try {
      let query = supabase.from("clubs").select("*");
      
      // Admin Klub only sees their own club
      if (isAdminKlub && clubId) {
        query = query.eq("id", clubId);
      }
      
      // For Admin Federasi, only show approved clubs in main tab
      if (isAdminFederasi) {
        query = query.neq("license_status", "pending");
      }
      
      const { data, error } = await query.order("name");

      if (error) throw error;
      setClubs(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data klub",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingClubs = async () => {
    try {
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("license_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingClubs(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data klub pending",
        description: error.message,
      });
    }
  };

  const handleRefresh = () => {
    fetchClubs();
    if (isAdminFederasi) {
      fetchPendingClubs();
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAdminKlub ? "Klub Saya" : "Manajemen Klub"}
          </h2>
          <p className="text-muted-foreground">
            {isAdminKlub ? "Kelola profil klub Anda" : "Kelola data klub sepakbola"}
          </p>
        </div>
        {!isAdminKlub && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Klub
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari klub atau kota..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
      ) : isAdminFederasi ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              Semua Klub
              <Badge variant="secondary" className="ml-2">
                {filteredClubs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Klub Pending
              {pendingClubs.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingClubs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {filteredClubs.length === 0 ? (
              <div className="rounded-md border">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm ? "Tidak ada klub yang ditemukan" : "Belum ada data klub"}
                  </p>
                </div>
              </div>
            ) : (
              <ClubsTable clubs={filteredClubs} onRefresh={handleRefresh} />
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6">
            <PendingClubsTable clubs={pendingClubs} onRefresh={handleRefresh} />
          </TabsContent>
        </Tabs>
      ) : filteredClubs.length === 0 ? (
        <div className="rounded-md border">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "Tidak ada klub yang ditemukan" : "Belum ada data klub"}
            </p>
          </div>
        </div>
      ) : (
        <ClubsTable clubs={filteredClubs} onRefresh={handleRefresh} />
      )}

      <ClubFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchClubs}
      />

      <DataImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="clubs"
        onSuccess={fetchClubs}
      />
    </div>
  );
};

export default Clubs;