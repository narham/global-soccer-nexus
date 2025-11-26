import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PanitiaCompetitionCard } from "@/components/panitia/PanitiaCompetitionCard";
import { CompetitionFormDialog } from "@/components/competitions/CompetitionFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PanitiaCompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat kompetisi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCompetitions = (status: string) => {
    if (status === "all") return competitions;
    return competitions.filter((c) => c.approval_status === status);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kompetisi Saya</h1>
          <p className="text-muted-foreground">Kelola kompetisi yang Anda buat</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Kompetisi
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            Semua ({competitions.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterCompetitions("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Disetujui ({filterCompetitions("approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Ditolak ({filterCompetitions("rejected").length})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            {filterCompetitions(status).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Belum ada kompetisi {status !== "all" && `dengan status ${status}`}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterCompetitions(status).map((competition) => (
                  <PanitiaCompetitionCard
                    key={competition.id}
                    competition={competition}
                    onView={(id) => navigate(`/panitia/competitions/${id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CompetitionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchCompetitions}
      />
    </div>
  );
}
