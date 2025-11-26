import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { ClubHeader } from "@/components/clubs/ClubHeader";
import { ClubInfoTab } from "@/components/clubs/ClubInfoTab";
import { ClubDocumentsTab } from "@/components/clubs/ClubDocumentsTab";
import { ClubStaffTab } from "@/components/clubs/ClubStaffTab";
import { ClubPlayersTab } from "@/components/clubs/ClubPlayersTab";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  const fetchClubData = async () => {
    try {
      setLoading(true);

      // Fetch club details
      const { data: clubData, error: clubError } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", id)
        .single();

      if (clubError) throw clubError;
      setClub(clubData);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from("club_documents")
        .select("*")
        .eq("club_id", id)
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;
      setDocuments(docsData || []);

      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from("club_staff")
        .select("*")
        .eq("club_id", id)
        .order("role", { ascending: true });

      if (staffError) throw staffError;
      setStaff(staffData || []);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("current_club_id", id)
        .order("shirt_number", { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error: any) {
      toast.error(error.message);
      navigate("/clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClubData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Klub tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/clubs")}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Daftar Klub
      </Button>

      <ClubHeader club={club} />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Info Umum</TabsTrigger>
          <TabsTrigger value="documents">Dokumen ({documents.length})</TabsTrigger>
          <TabsTrigger value="staff">Staf ({staff.length})</TabsTrigger>
          <TabsTrigger value="players">Pemain ({players.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <ClubInfoTab club={club} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <ClubDocumentsTab clubId={club.id} documents={documents} onRefresh={fetchClubData} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <ClubStaffTab clubId={club.id} staff={staff} onRefresh={fetchClubData} />
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <ClubPlayersTab players={players} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubDetail;
