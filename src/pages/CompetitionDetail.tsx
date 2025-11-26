import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitionHeader } from "@/components/competitions/CompetitionHeader";
import { CompetitionInfoTab } from "@/components/competitions/CompetitionInfoTab";
import { CompetitionTeamsTab } from "@/components/competitions/CompetitionTeamsTab";
import { CompetitionMatchesTab } from "@/components/competitions/CompetitionMatchesTab";
import { CompetitionStandingsTab } from "@/components/competitions/CompetitionStandingsTab";
import CompetitionPlayerValidationTab from "@/components/competitions/CompetitionPlayerValidationTab";
import { CompetitionFormDialog } from "@/components/competitions/CompetitionFormDialog";

const CompetitionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompetition();
    }
  }, [id]);

  const fetchCompetition = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCompetition(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data kompetisi",
        description: error.message,
      });
      navigate("/competitions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!competition) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/competitions")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Button onClick={() => setEditOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Kompetisi
        </Button>
      </div>

      <CompetitionHeader competition={competition} />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">📋 Info</TabsTrigger>
          <TabsTrigger value="teams">👥 Peserta</TabsTrigger>
          <TabsTrigger value="matches">⚽ Jadwal</TabsTrigger>
          <TabsTrigger value="standings">📊 Klasemen</TabsTrigger>
          <TabsTrigger value="players">✅ Validasi Pemain</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CompetitionInfoTab competition={competition} />
        </TabsContent>

        <TabsContent value="teams">
          <CompetitionTeamsTab competitionId={competition.id} format={competition.format} />
        </TabsContent>

        <TabsContent value="matches">
          <CompetitionMatchesTab competitionId={competition.id} />
        </TabsContent>

        <TabsContent value="standings">
          <CompetitionStandingsTab competitionId={competition.id} format={competition.format} />
        </TabsContent>

        <TabsContent value="players">
          <CompetitionPlayerValidationTab competitionId={competition.id} />
        </TabsContent>
      </Tabs>

      <CompetitionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        competition={competition}
        onSuccess={fetchCompetition}
      />
    </div>
  );
};

export default CompetitionDetail;
