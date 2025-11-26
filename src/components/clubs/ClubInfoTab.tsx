import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Calendar, Shirt } from "lucide-react";

interface ClubInfoTabProps {
  club: any;
}

export const ClubInfoTab = ({ club }: ClubInfoTabProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Informasi Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Kota</p>
            <p className="font-medium">{club.city || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Alamat Lengkap</p>
            <p className="font-medium">{club.address || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stadion Kandang</p>
            <p className="font-medium">{club.stadium_name || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Informasi Klub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Nama Lengkap</p>
            <p className="font-medium">{club.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nama Pendek</p>
            <p className="font-medium">{club.short_name || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tahun Berdiri
            </p>
            <p className="font-medium">{club.founded_year || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shirt className="w-5 h-5" />
            Warna Seragam
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Warna Home</p>
            <p className="font-medium">{club.home_color || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Warna Away</p>
            <p className="font-medium">{club.away_color || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lisensi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Status Lisensi</p>
            <p className="font-medium capitalize">{club.license_status || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valid Hingga</p>
            <p className="font-medium">
              {club.license_valid_until
                ? new Date(club.license_valid_until).toLocaleDateString("id-ID")
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
