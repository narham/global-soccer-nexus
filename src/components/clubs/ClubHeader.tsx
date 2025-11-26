import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface ClubHeaderProps {
  club: any;
}

export const ClubHeader = ({ club }: ClubHeaderProps) => {
  const getLicenseColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getLicenseLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktif";
      case "pending":
        return "Pending";
      case "inactive":
        return "Tidak Aktif";
      default:
        return status;
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <Shield className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{club.name}</h1>
              {club.short_name && (
                <p className="text-muted-foreground mt-1">{club.short_name}</p>
              )}
            </div>
            <Badge className={getLicenseColor(club.license_status)}>
              {getLicenseLabel(club.license_status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Kota</p>
              <p className="font-medium">{club.city || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stadion</p>
              <p className="font-medium">{club.stadium_name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tahun Berdiri</p>
              <p className="font-medium">{club.founded_year || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warna Tim</p>
              <p className="font-medium">{club.home_color || "-"} / {club.away_color || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
