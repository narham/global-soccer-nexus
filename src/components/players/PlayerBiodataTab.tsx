import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { validateNIK } from "@/lib/nik-validator";
import { CheckCircle, AlertCircle } from "lucide-react";

interface PlayerBiodataTabProps {
  player: any;
}

export const PlayerBiodataTab = ({ player }: PlayerBiodataTabProps) => {
  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return format(new Date(date), "dd MMMM yyyy", { locale: id });
  };

  const nikValidation = player.nik ? validateNIK(player.nik) : null;

  const bioFields = [
    { label: "Nama Lengkap", value: player.full_name },
    { label: "Tempat Lahir", value: player.place_of_birth || "—" },
    { label: "Tanggal Lahir", value: formatDate(player.date_of_birth) },
    { label: "Kewarganegaraan", value: player.nationality },
    { label: "Posisi", value: player.position },
    { label: "No. Punggung", value: player.shirt_number || "—" },
    { label: "Tinggi Badan", value: player.height_cm ? `${player.height_cm} cm` : "—" },
    { label: "Berat Badan", value: player.weight_kg ? `${player.weight_kg} kg` : "—" },
    { label: "Kaki Dominan", value: player.preferred_foot || "—" },
    { label: "Market Value", value: formatCurrency(player.market_value) },
    { label: "Klub Saat Ini", value: player.clubs?.name || "—" },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Biodata Lengkap</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bioFields.map((field) => (
            <div key={field.label} className="space-y-1">
              <p className="text-sm text-muted-foreground">{field.label}</p>
              <p className="font-medium">{field.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* NIK Information for Indonesian players */}
      {player.nationality === "Indonesia" && player.nik && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            NIK (Nomor Induk Kependudukan)
            {nikValidation?.isValid ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Invalid
              </Badge>
            )}
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">NIK</p>
              <p className="font-mono font-medium text-lg">{player.nik}</p>
            </div>

            {nikValidation?.isValid && nikValidation.info && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Provinsi</p>
                  <p className="font-medium">{nikValidation.info.province}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kabupaten/Kota</p>
                  <p className="font-medium">{nikValidation.info.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kecamatan</p>
                  <p className="font-medium">{nikValidation.info.district}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jenis Kelamin (dari NIK)</p>
                  <p className="font-medium">
                    {nikValidation.info.gender === "male" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
