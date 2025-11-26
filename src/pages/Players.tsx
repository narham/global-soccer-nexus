import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PlayersTable } from "@/components/PlayersTable";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerFormDialog } from "@/components/players/PlayerFormDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { TransferFormDialog } from "@/components/transfers/TransferFormDialog";

interface Player {
  id: string;
  full_name: string;
  position: string;
  shirt_number: number | null;
  nationality: string;
  date_of_birth: string;
  injury_status: string;
  clubs?: {
    name: string;
  };
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState<{ playerId: string; fromClubId: string } | null>(null);
  const { toast } = useToast();
  const { isAdminKlub, clubId } = useUserRole();

  useEffect(() => {
    // Listen for transfer dialog trigger from PlayerFormDialog
    const handleOpenTransfer = (event: CustomEvent) => {
      setTransferData(event.detail);
      setTransferDialogOpen(true);
    };
    
    window.addEventListener('openTransferDialog', handleOpenTransfer as EventListener);
    return () => {
      window.removeEventListener('openTransferDialog', handleOpenTransfer as EventListener);
    };
  }, []);

  useEffect(() => {
    // Only fetch players when role is determined and clubId is available for Admin Klub
    if (isAdminKlub && !clubId) {
      return; // Wait for clubId to be available
    }
    fetchPlayers();
  }, [isAdminKlub, clubId]);

  const fetchPlayers = async () => {
    try {
      let query = supabase
        .from("players")
        .select(`
          *,
          clubs:current_club_id (name)
        `);

      // Filter by club if Admin Klub
      if (isAdminKlub && clubId) {
        query = query.eq("current_club_id", clubId);
      }

      const { data, error } = await query.order("full_name");

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data pemain",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.clubs?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAdminKlub ? "Pemain Klub Saya" : "Manajemen Pemain"}
          </h2>
          <p className="text-muted-foreground">
            {isAdminKlub ? "Kelola pemain di klub Anda" : "Database pemain sepakbola"}
          </p>
        </div>
        {(!isAdminKlub || (isAdminKlub && clubId)) && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrasi Pemain
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari pemain atau posisi..."
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
      ) : filteredPlayers.length === 0 ? (
        <div className="rounded-md border">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "Tidak ada pemain yang ditemukan" : "Belum ada data pemain"}
            </p>
          </div>
        </div>
      ) : (
        <PlayersTable players={filteredPlayers} onRefresh={fetchPlayers} />
      )}

      <PlayerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchPlayers}
      />

      <TransferFormDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onSuccess={fetchPlayers}
      />
    </div>
  );
};

export default Players;