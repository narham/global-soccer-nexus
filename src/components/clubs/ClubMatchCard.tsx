import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, MapPin, Trophy } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ClubMatchCardProps {
  match: any;
  clubId: string;
  onManage: (match: any, initialTab?: string) => void;
}

export const ClubMatchCard = ({ match, clubId, onManage }: ClubMatchCardProps) => {
  const isHomeMatch = match.home_club_id === clubId;
  const homeClub = match.home_club || {};
  const awayClub = match.away_club || {};
  const competition = match.competition || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "destructive";
      case "finished":
        return "secondary";
      case "postponed":
        return "outline";
      case "cancelled":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live":
        return "LIVE";
      case "finished":
        return "Selesai";
      case "scheduled":
        return "Dijadwalkan";
      case "postponed":
        return "Ditunda";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(match.match_date), "dd MMM yyyy, HH:mm", { locale: idLocale })}</span>
            <Trophy className="h-4 w-4 ml-2" />
            <span>{competition.name}</span>
          </div>
          <Badge variant={getStatusColor(match.status)}>
            {getStatusLabel(match.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {homeClub.logo_url && (
              <img src={homeClub.logo_url} alt={homeClub.name} className="h-12 w-12 object-contain" />
            )}
            <div className="flex-1">
              <p className={`font-semibold ${isHomeMatch ? "text-primary" : ""}`}>
                {homeClub.name || homeClub.short_name}
              </p>
            </div>
          </div>

          <div className="px-6 text-center">
            <div className="text-3xl font-bold">
              {match.home_score ?? "-"} : {match.away_score ?? "-"}
            </div>
            {match.half_time_home_score !== null && (
              <div className="text-sm text-muted-foreground">
                ({match.half_time_home_score} - {match.half_time_away_score} HT)
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="flex-1 text-right">
              <p className={`font-semibold ${!isHomeMatch ? "text-primary" : ""}`}>
                {awayClub.name || awayClub.short_name}
              </p>
            </div>
            {awayClub.logo_url && (
              <img src={awayClub.logo_url} alt={awayClub.name} className="h-12 w-12 object-contain" />
            )}
          </div>
        </div>

        {match.venue && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{match.venue}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>⚽ {(match.match_events?.filter((e: any) => e.event_type === "goal")?.length || 0)} Goals</span>
            <span>🟨 {(match.match_events?.filter((e: any) => e.event_type === "card")?.length || 0)} Cards</span>
            <span>🔄 {(match.match_events?.filter((e: any) => e.event_type === "substitution")?.length || 0)} Subs</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onManage(match, "lineup")}
          >
            <Users className="h-4 w-4 mr-2" />
            Lineup
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onManage(match, "events")}
          >
            📝 Events
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onManage(match, "stats")}
          >
            📊 Statistik
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onManage(match, "report")}
          >
            📋 Laporan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
