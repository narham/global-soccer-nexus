import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface MatchHeaderProps {
  match: any;
}

export const MatchHeader = ({ match }: MatchHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "first_half":
      case "second_half":
      case "extra_first_half":
      case "extra_second_half":
      case "penalty_shootout":
      case "live": return "destructive";
      case "half_time":
      case "extra_half_time": return "outline";
      case "finished": return "default";
      case "scheduled": return "secondary";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "first_half": return "Babak 1";
      case "half_time": return "Istirahat";
      case "second_half": return "Babak 2";
      case "extra_first_half": return "ET Babak 1";
      case "extra_half_time": return "Istirahat ET";
      case "extra_second_half": return "ET Babak 2";
      case "penalty_shootout": return "Adu Penalti";
      case "live": return "LIVE";
      case "finished": return "Selesai";
      case "scheduled": return "Dijadwalkan";
      case "postponed": return "Ditunda";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  const isLive = ["first_half", "second_half", "extra_first_half", "extra_second_half", "penalty_shootout", "live"].includes(match.status);
  const showHtScore = match.half_time_home_score !== null && match.half_time_away_score !== null;
  const showEtScore = match.extra_time_home_score !== null && match.extra_time_away_score !== null;
  const showPenaltyScore = match.penalty_home_score !== null && match.penalty_away_score !== null;
  const isExtraTime = ["extra_first_half", "extra_half_time", "extra_second_half"].includes(match.status);
  const isPenalty = match.status === "penalty_shootout";

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Competition & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{match.competition?.name}</Badge>
            {match.matchday && <Badge variant="outline">Matchday {match.matchday}</Badge>}
            {match.round && <Badge variant="outline">{match.round}</Badge>}
            {match.group_name && <Badge variant="outline">Grup {match.group_name}</Badge>}
          </div>
          <Badge variant={getStatusColor(match.status)} className={`text-lg px-4 py-2 ${isLive ? "animate-pulse" : ""}`}>
            {getStatusLabel(match.status)}
          </Badge>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              {match.home_club?.logo_url ? (
                <img src={match.home_club.logo_url} alt={match.home_club.name} className="w-16 h-16 object-contain" />
              ) : (
                <div className="text-3xl font-bold" style={{ color: match.home_club?.home_color || "#000" }}>
                  {match.home_club?.name?.substring(0, 3).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold">{match.home_club?.name}</h2>
            <Badge variant="outline" className="mt-2">HOME</Badge>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <div className="text-6xl font-bold flex items-center gap-4">
              <span className="text-primary">{match.home_score ?? "—"}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-primary">{match.away_score ?? "—"}</span>
            </div>

            {/* Penalty Score */}
            {showPenaltyScore && (
              <div className="mt-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide font-medium">Penalti</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                  {match.penalty_home_score} - {match.penalty_away_score}
                </p>
              </div>
            )}

            {/* Extra Time Score */}
            {showEtScore && (
              <p className="text-sm text-muted-foreground mt-1">
                AET: {match.extra_time_home_score} - {match.extra_time_away_score}
              </p>
            )}

            {/* HT Score */}
            {showHtScore && (
              <p className="text-sm text-muted-foreground mt-1">
                HT: {match.half_time_home_score} - {match.half_time_away_score}
              </p>
            )}

            {/* Live indicator */}
            {isLive && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>{getStatusLabel(match.status)}</span>
              </div>
            )}
            {(match.status === "half_time" || match.status === "extra_half_time") && (
              <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                <span>☕ {match.status === "extra_half_time" ? "Istirahat ET" : "Istirahat"}</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              {match.away_club?.logo_url ? (
                <img src={match.away_club.logo_url} alt={match.away_club.name} className="w-16 h-16 object-contain" />
              ) : (
                <div className="text-3xl font-bold" style={{ color: match.away_club?.away_color || "#000" }}>
                  {match.away_club?.name?.substring(0, 3).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold">{match.away_club?.name}</h2>
            <Badge variant="outline" className="mt-2">AWAY</Badge>
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tanggal</p>
              <p className="font-medium">
                {format(new Date(match.match_date), "d MMM yyyy, HH:mm", { locale: id })} WIB
              </p>
            </div>
          </div>
          {match.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-medium">{match.venue}</p>
              </div>
            </div>
          )}
          {match.referee_name && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Wasit</p>
                <p className="font-medium">{match.referee_name}</p>
              </div>
            </div>
          )}
          {match.attendance && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Penonton</p>
                <p className="font-medium">{match.attendance.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};