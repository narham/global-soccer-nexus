import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompetitionsTable } from "@/components/CompetitionsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { CompetitionFormDialog } from "@/components/competitions/CompetitionFormDialog";
import { DataImportDialog } from "@/components/import/DataImportDialog";
import { useUserRole } from "@/hooks/useUserRole";

interface Competition {
  id: string;
  name: string;
  season: string;
  type: string;
  format: string;
  status: string;
  start_date: string;
  end_date: string | null;
  num_teams: number | null;
}

const Competitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();
  const { isAdminFederasi, isPanitia } = useUserRole();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data kompetisi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const activeCompetitions = competitions.filter(c => 
    c.status === "active" || c.status === "upcoming"
  );
  
  const finishedCompetitions = competitions.filter(c => 
    c.status === "finished"
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Kompetisi</h2>
          <p className="text-muted-foreground">Kelola liga, turnamen, dan kompetisi</p>
        </div>
        <div className="flex gap-2">
          {(isAdminFederasi || isPanitia) && (
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Kompetisi
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Aktif & Akan Datang</TabsTrigger>
            <TabsTrigger value="finished">Arsip</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {activeCompetitions.length === 0 ? (
              <div className="rounded-md border">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Tidak ada kompetisi aktif</p>
                </div>
              </div>
            ) : (
              <CompetitionsTable competitions={activeCompetitions} onRefresh={fetchCompetitions} />
            )}
          </TabsContent>

          <TabsContent value="finished" className="mt-6">
            {finishedCompetitions.length === 0 ? (
              <div className="rounded-md border">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">Belum ada kompetisi yang selesai</p>
                </div>
              </div>
            ) : (
              <CompetitionsTable competitions={finishedCompetitions} onRefresh={fetchCompetitions} />
            )}
          </TabsContent>
        </Tabs>
      )}

      <CompetitionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCompetitions}
      />

      <DataImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="competitions"
        onSuccess={fetchCompetitions}
      />
    </div>
  );
};

export default Competitions;