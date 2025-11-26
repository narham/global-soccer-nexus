import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchLineupTab } from "@/components/matches/MatchLineupTab";
import { MatchEventsTab } from "@/components/matches/MatchEventsTab";
import { MatchStatsTab } from "@/components/matches/MatchStatsTab";
import { MatchReportTab } from "@/components/matches/MatchReportTab";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ClubMatchManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  initialTab?: string;
}

export const ClubMatchManageDialog = ({
  open,
  onOpenChange,
  match,
  initialTab = "lineup",
}: ClubMatchManageDialogProps) => {
  if (!match) return null;

  const homeClub = match.home_club || {};
  const awayClub = match.away_club || {};
  const competition = match.competition || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">
                {homeClub.name} vs {awayClub.name}
              </span>
              <span className="text-lg font-semibold">
                {match.home_score ?? 0} - {match.away_score ?? 0}
              </span>
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              {competition.name} - {format(new Date(match.match_date), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lineup">👥 Lineup</TabsTrigger>
            <TabsTrigger value="events">📝 Events</TabsTrigger>
            <TabsTrigger value="stats">📊 Statistik</TabsTrigger>
            <TabsTrigger value="report">📋 Laporan</TabsTrigger>
          </TabsList>

          <TabsContent value="lineup" className="mt-6">
            <MatchLineupTab
              matchId={match.id}
              homeClub={homeClub}
              awayClub={awayClub}
            />
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <MatchEventsTab
              matchId={match.id}
              homeClub={homeClub}
              awayClub={awayClub}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <MatchStatsTab
              matchId={match.id}
              homeClub={homeClub}
              awayClub={awayClub}
            />
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <MatchReportTab match={match} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
