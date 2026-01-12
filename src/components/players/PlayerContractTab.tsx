import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { AlertCircle, TrendingUp, UserMinus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface PlayerContractTabProps {
  player: any;
  onUpdate: () => void;
}

export const PlayerContractTab = ({ player, onUpdate }: PlayerContractTabProps) => {
  const { toast } = useToast();
  const { isAdminFederasi } = useUserRole();
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return format(new Date(date), "dd MMMM yyyy", { locale: id });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getInjuryBadge = (status: string) => {
    switch (status) {
      case "fit":
        return <Badge variant="default">Fit - Siap Bermain</Badge>;
      case "cedera":
        return <Badge variant="destructive">Cedera - Tidak Dapat Bermain</Badge>;
      case "pemulihan":
        return <Badge variant="secondary">Dalam Pemulihan</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  const getTransferBadge = (status: string) => {
    switch (status) {
      case "not_available":
        return <Badge variant="outline">Tidak Tersedia</Badge>;
      case "available":
        return <Badge variant="default">Tersedia untuk Transfer</Badge>;
      case "on_loan":
        return <Badge variant="secondary">Sedang Dipinjamkan</Badge>;
      case "loan_listed":
        return <Badge>Tersedia Dipinjamkan</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  const contractWarning = player.contract_end
    ? differenceInDays(new Date(player.contract_end), new Date())
    : null;

  const isFreeAgent = !player.current_club_id;

  const handleReleasePlayer = async () => {
    setReleasing(true);
    try {
      // Update player to free agent status
      const { error: playerError } = await supabase
        .from("players")
        .update({
          current_club_id: null,
          transfer_status: "available",
          contract_end: new Date().toISOString().split('T')[0],
        })
        .eq("id", player.id);

      if (playerError) throw playerError;

      // Add history record for the release
      if (player.current_club_id) {
        const { error: historyError } = await supabase
          .from("player_history")
          .update({ to_date: new Date().toISOString().split('T')[0] })
          .eq("player_id", player.id)
          .eq("club_id", player.current_club_id)
          .is("to_date", null);

        if (historyError) console.error("Failed to update history:", historyError);
      }

      toast({
        title: "Pemain dilepas dari klub",
        description: `${player.full_name} sekarang menjadi Free Agent`,
      });
      
      setReleaseDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal melepas pemain",
        description: error.message,
      });
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="space-y-6">
      {contractWarning !== null && contractWarning < 180 && contractWarning > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Peringatan:</strong> Kontrak akan berakhir dalam {contractWarning} hari ({formatDate(player.contract_end)})
          </AlertDescription>
        </Alert>
      )}

      {contractWarning !== null && contractWarning <= 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Kontrak Telah Berakhir!</strong> Kontrak berakhir pada {formatDate(player.contract_end)}
          </AlertDescription>
        </Alert>
      )}

      {player.injury_status === "cedera" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pemain Cedera!</strong> Saat ini tidak dapat bermain.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Informasi Kontrak</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Klub Saat Ini</p>
              <p className="font-semibold text-lg">{player.clubs?.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mulai Kontrak</p>
              <p className="font-medium">{formatDate(player.contract_start)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Akhir Kontrak</p>
              <p className="font-medium">{formatDate(player.contract_end)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Market Value</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="font-semibold text-lg">{formatCurrency(player.market_value)}</p>
              </div>
            </div>
            {contractWarning !== null && contractWarning > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Sisa Waktu Kontrak</p>
                <p className="font-medium">{contractWarning} hari</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Status Pemain</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status Cedera</p>
            {getInjuryBadge(player.injury_status)}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Status Transfer</p>
            {getTransferBadge(player.transfer_status)}
          </div>
        </div>
      </Card>

      {/* Admin Federasi can release player from club */}
      {isAdminFederasi && player.current_club_id && !isFreeAgent && (
        <Card className="p-6 border-amber-500/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-amber-600" />
            Tindakan Admin Federasi
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sebagai Admin Federasi, Anda dapat melepas pemain dari klubnya dan menjadikannya Free Agent.
              Tindakan ini biasanya dilakukan jika:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Kontrak pemain telah berakhir</li>
              <li>Pemain diberhentikan oleh klub</li>
              <li>Mutasi pemain atas permintaan federasi</li>
            </ul>
            <Button 
              variant="outline" 
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
              onClick={() => setReleaseDialogOpen(true)}
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Lepas dari Klub
            </Button>
          </div>
        </Card>
      )}

      {isFreeAgent && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Status: Free Agent</strong> - Pemain ini tidak terikat kontrak dengan klub manapun dan dapat direkrut langsung.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Catatan FIFA/AFC</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Sesuai FIFA TMS, semua transfer internasional harus diregistrasi</p>
          <p>• Kontrak pemain harus diperpanjang minimal 6 bulan sebelum berakhir</p>
          <p>• Medical clearance diperlukan sebelum pemain dapat bermain</p>
          <p>• Transfer window sesuai regulasi AFC dan FIFA</p>
        </div>
      </Card>

      {/* Release confirmation dialog */}
      <AlertDialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lepas Pemain dari Klub?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan melepas <strong>{player.full_name}</strong> dari <strong>{player.clubs?.name}</strong>.
              Pemain akan menjadi Free Agent dan dapat direkrut oleh klub lain.
              <br /><br />
              Tindakan ini akan:
              <ul className="list-disc list-inside mt-2">
                <li>Menghapus afiliasi pemain dengan klub</li>
                <li>Mengubah status transfer menjadi "Tersedia"</li>
                <li>Mencatat tanggal berakhir di riwayat klub</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releasing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleasePlayer}
              disabled={releasing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {releasing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lepas Pemain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
