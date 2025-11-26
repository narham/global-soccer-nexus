import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Ruler, Weight, FootprintsIcon } from "lucide-react";

interface PlayerHeaderProps {
  player: any;
}

export const PlayerHeader = ({ player }: PlayerHeaderProps) => {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "GK": return "secondary";
      case "DF": return "default";
      case "MF": return "outline";
      case "FW": return "destructive";
      default: return "outline";
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case "GK": return "Penjaga Gawang";
      case "DF": return "Bek";
      case "MF": return "Gelandang";
      case "FW": return "Penyerang";
      default: return position;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <User className="w-16 h-16 text-primary" />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{player.full_name}</h1>
              {player.shirt_number && (
                <span className="text-4xl font-bold text-primary">#{player.shirt_number}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getPositionColor(player.position)}>
                {getPositionLabel(player.position)}
              </Badge>
              {player.clubs && (
                <Badge variant="outline">{player.clubs.name}</Badge>
              )}
              <Badge variant="outline">{player.nationality}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Usia</p>
                <p className="font-semibold">{calculateAge(player.date_of_birth)} tahun</p>
              </div>
            </div>
            {player.height_cm && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tinggi</p>
                  <p className="font-semibold">{player.height_cm} cm</p>
                </div>
              </div>
            )}
            {player.weight_kg && (
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Berat</p>
                  <p className="font-semibold">{player.weight_kg} kg</p>
                </div>
              </div>
            )}
            {player.preferred_foot && (
              <div className="flex items-center gap-2">
                <FootprintsIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Kaki</p>
                  <p className="font-semibold">{player.preferred_foot}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
