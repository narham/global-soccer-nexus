import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerHeader } from "@/components/players/PlayerHeader";
import { PlayerBiodataTab } from "@/components/players/PlayerBiodataTab";
import { PlayerStatisticsTab } from "@/components/players/PlayerStatisticsTab";
import { PlayerHistoryTab } from "@/components/players/PlayerHistoryTab";
import { PlayerContractTab } from "@/components/players/PlayerContractTab";
import { PlayerFormDialog } from "@/components/players/PlayerFormDialog";
import { useUserRole } from "@/hooks/useUserRole";

const PlayerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const { isAdminKlub, clubId, isAdminFederasi } = useUserRole();

  useEffect(() => {
    if (id) {
      fetchPlayer();
    }
  }, [id]);

  const fetchPlayer = async () => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select(`
          *,
          clubs:current_club_id (id, name, logo_url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data pemain",
        description: error.message,
      });
      navigate("/players");
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

  if (!player) return null;

  // Check if Admin Klub can edit this player
  const canEdit = isAdminFederasi || (isAdminKlub && player.current_club_id === clubId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/players")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        {canEdit && (
          <Button onClick={() => setEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Pemain
          </Button>
        )}
      </div>

      <PlayerHeader player={player} />

      <Tabs defaultValue="biodata" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="biodata">📋 Biodata</TabsTrigger>
          <TabsTrigger value="statistics">📊 Statistik</TabsTrigger>
          <TabsTrigger value="history">🔄 Riwayat Klub</TabsTrigger>
          <TabsTrigger value="contract">📝 Kontrak & Status</TabsTrigger>
        </TabsList>

        <TabsContent value="biodata">
          <PlayerBiodataTab player={player} />
        </TabsContent>

        <TabsContent value="statistics">
          <PlayerStatisticsTab playerId={player.id} />
        </TabsContent>

        <TabsContent value="history">
          <PlayerHistoryTab playerId={player.id} />
        </TabsContent>

        <TabsContent value="contract">
          <PlayerContractTab player={player} onUpdate={fetchPlayer} />
        </TabsContent>
      </Tabs>

      <PlayerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        player={player}
        onSuccess={fetchPlayer}
      />
    </div>
  );
};

export default PlayerDetail;
