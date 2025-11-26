import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import { AlertCircle, TrendingUp } from "lucide-react";

interface PlayerContractTabProps {
  player: any;
  onUpdate: () => void;
}

export const PlayerContractTab = ({ player }: PlayerContractTabProps) => {
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Catatan FIFA/AFC</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Sesuai FIFA TMS, semua transfer internasional harus diregistrasi</p>
          <p>• Kontrak pemain harus diperpanjang minimal 6 bulan sebelum berakhir</p>
          <p>• Medical clearance diperlukan sebelum pemain dapat bermain</p>
          <p>• Transfer window sesuai regulasi AFC dan FIFA</p>
        </div>
      </Card>
    </div>
  );
};
