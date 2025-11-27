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
import { CompetitionDocumentsTab } from "@/components/competitions/CompetitionDocumentsTab";
import { CompetitionFormDialog } from "@/components/competitions/CompetitionFormDialog";
import { CompetitionApprovalBadge } from "@/components/panitia/CompetitionApprovalBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PanitiaCompetitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [competition, setCompetition] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompetition();
      fetchDocuments();
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
      navigate("/panitia/competitions");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("competition_documents")
        .select("*")
        .eq("competition_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat dokumen",
        description: error.message,
      });
    }
  };

  const canEdit = competition?.approval_status === "pending" || competition?.approval_status === "rejected";
  const isApproved = competition?.approval_status === "approved";

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
        <Button variant="ghost" onClick={() => navigate("/panitia/competitions")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          <CompetitionApprovalBadge status={competition.approval_status} />
          {canEdit && (
            <Button onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Kompetisi
            </Button>
          )}
        </div>
      </div>

      {competition.approval_status === "pending" && (
        <Alert>
          <AlertDescription>
            Kompetisi ini sedang menunggu persetujuan dari Admin Federasi.
            Anda tidak dapat mengelola tim dan pertandingan sampai kompetisi disetujui.
          </AlertDescription>
        </Alert>
      )}

      {competition.approval_status === "rejected" && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium">Kompetisi ini ditolak oleh Admin Federasi.</p>
            {competition.rejection_reason && (
              <p className="mt-2">Alasan: {competition.rejection_reason}</p>
            )}
            <p className="mt-2">Silakan edit dan ajukan kembali.</p>
          </AlertDescription>
        </Alert>
      )}

      <CompetitionHeader competition={competition} />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">📋 Info</TabsTrigger>
          <TabsTrigger value="teams" disabled={!isApproved}>👥 Peserta</TabsTrigger>
          <TabsTrigger value="matches" disabled={!isApproved}>⚽ Jadwal</TabsTrigger>
          <TabsTrigger value="standings" disabled={!isApproved}>📊 Klasemen</TabsTrigger>
          <TabsTrigger value="documents">📎 Dokumen</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <CompetitionInfoTab competition={competition} />
        </TabsContent>

        {isApproved && (
          <>
            <TabsContent value="teams">
              <CompetitionTeamsTab competitionId={competition.id} format={competition.format} />
            </TabsContent>

            <TabsContent value="matches">
              <CompetitionMatchesTab competitionId={competition.id} />
            </TabsContent>

            <TabsContent value="standings">
              <CompetitionStandingsTab competitionId={competition.id} format={competition.format} />
            </TabsContent>
          </>
        )}

        <TabsContent value="documents">
          <CompetitionDocumentsTab 
            competitionId={id!} 
            documents={documents} 
            onRefresh={fetchDocuments} 
          />
        </TabsContent>
      </Tabs>

      {canEdit && (
        <CompetitionFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          competition={competition}
          onSuccess={fetchCompetition}
        />
      )}
    </div>
  );
}
