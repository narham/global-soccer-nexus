import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, Users, PlaySquare } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CompetitionHeaderProps {
  competition: any;
}

export const CompetitionHeader = ({ competition }: CompetitionHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "upcoming": return "secondary";
      case "finished": return "outline";
      default: return "outline";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "liga": return "Liga";
      case "piala": return "Piala";
      case "youth_league": return "Liga Muda";
      default: return type;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "round_robin": return "Round Robin";
      case "knockout": return "Knockout";
      case "group_knockout": return "Grup + Knockout";
      default: return format;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Aktif";
      case "upcoming": return "Akan Datang";
      case "finished": return "Selesai";
      default: return status;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center">
            {competition.logo_url ? (
              <img src={competition.logo_url} alt={competition.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Trophy className="w-16 h-16 text-primary" />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{competition.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusColor(competition.status)}>
                {getStatusLabel(competition.status)}
              </Badge>
              <Badge variant="outline">{getTypeLabel(competition.type)}</Badge>
              <Badge variant="outline">{getFormatLabel(competition.format)}</Badge>
              <Badge variant="outline">Musim {competition.season}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                <p className="font-semibold">
                  {format(new Date(competition.start_date), "d MMM yyyy", { locale: id })}
                </p>
              </div>
            </div>
            {competition.end_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                  <p className="font-semibold">
                    {format(new Date(competition.end_date), "d MMM yyyy", { locale: id })}
                  </p>
                </div>
              </div>
            )}
            {competition.num_teams && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Jumlah Tim</p>
                  <p className="font-semibold">{competition.num_teams} tim</p>
                </div>
              </div>
            )}
            {competition.num_groups && (
              <div className="flex items-center gap-2">
                <PlaySquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Jumlah Grup</p>
                  <p className="font-semibold">{competition.num_groups} grup</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
