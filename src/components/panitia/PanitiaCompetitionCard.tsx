import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import { CompetitionApprovalBadge } from "./CompetitionApprovalBadge";
import { format } from "date-fns";

interface PanitiaCompetitionCardProps {
  competition: any;
  onView: (id: string) => void;
}

export function PanitiaCompetitionCard({ competition, onView }: PanitiaCompetitionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{competition.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{competition.type}</Badge>
              <Badge variant="outline">{competition.format}</Badge>
              <CompetitionApprovalBadge status={competition.approval_status} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(competition.start_date), "dd MMM yyyy")} -{" "}
              {competition.end_date ? format(new Date(competition.end_date), "dd MMM yyyy") : "TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Musim {competition.season}</span>
          </div>
        </div>

        {competition.rejection_reason && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium text-destructive">Alasan Penolakan:</p>
            <p className="text-sm text-muted-foreground mt-1">{competition.rejection_reason}</p>
          </div>
        )}

        <Button className="w-full" onClick={() => onView(competition.id)}>
          Lihat Detail
        </Button>
      </CardContent>
    </Card>
  );
}
