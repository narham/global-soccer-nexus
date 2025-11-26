import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import CompetitionPlayerRegistrationTable from "@/components/clubs/CompetitionPlayerRegistrationTable";
import PlayerRegistrationFormDialog from "@/components/clubs/PlayerRegistrationFormDialog";

export default function ClubCompetitionPlayersPage() {
  const { id: clubId, compId: competitionId } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [clubId, competitionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch competition
      const { data: compData, error: compError } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", competitionId)
        .single();

      if (compError) throw compError;
      setCompetition(compData);

      // Fetch registrations
      const { data: regData, error: regError } = await supabase
        .from("competition_player_registrations")
        .select(`
          *,
          player:players(*)
        `)
        .eq("competition_id", competitionId)
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      if (regError) throw regError;
      setRegistrations(regData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (registration: any) => {
    setSelectedRegistration(registration);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pendaftaran ini?")) return;

    try {
      const { error } = await supabase
        .from("competition_player_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Pendaftaran berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting registration:", error);
      toast.error("Gagal menghapus pendaftaran");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/clubs/${clubId}/competitions`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{competition?.name}</h1>
          <p className="text-muted-foreground">
            Kelola pemain terdaftar untuk kompetisi ini
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => {
          setSelectedRegistration(null);
          setDialogOpen(true);
        }}>
          Daftarkan Pemain
        </Button>
      </div>

      <CompetitionPlayerRegistrationTable
        registrations={registrations}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PlayerRegistrationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clubId={clubId!}
        competitionId={competitionId!}
        registration={selectedRegistration}
        onSuccess={fetchData}
      />
    </div>
  );
}
