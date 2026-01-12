import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, XCircle, Circle, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ApprovalStep {
  label: string;
  status: "completed" | "current" | "pending" | "rejected" | "skipped";
  date?: string;
  approver?: string;
  notes?: string;
}

interface TransferApprovalTimelineProps {
  status: string;
  fromClubApprovedAt?: string | null;
  toClubApprovedAt?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  requiresFromClub: boolean;
}

export function TransferApprovalTimeline({
  status,
  fromClubApprovedAt,
  toClubApprovedAt,
  approvedAt,
  rejectedReason,
  requiresFromClub,
}: TransferApprovalTimelineProps) {
  const isFreeAgentTransfer = !requiresFromClub;

  const getSteps = (): ApprovalStep[] => {
    const steps: ApprovalStep[] = [];

    // Submission
    steps.push({
      label: isFreeAgentTransfer ? "Rekrutmen Free Agent Diajukan" : "Transfer Diajukan",
      status: "completed",
    });

    // From club approval (only if there's a previous club)
    if (requiresFromClub) {
      steps.push({
        label: "Persetujuan Klub Asal",
        status: fromClubApprovedAt
          ? "completed"
          : status === "pending_club_from"
          ? "current"
          : status === "rejected"
          ? "rejected"
          : "pending",
        date: fromClubApprovedAt || undefined,
      });
    } else {
      // Free agent - mark origin club as skipped
      steps.push({
        label: "Persetujuan Klub Asal",
        status: "skipped",
        notes: "Free Agent - tidak memerlukan persetujuan klub asal",
      });
    }

    // To club approval
    steps.push({
      label: "Persetujuan Klub Tujuan",
      status: toClubApprovedAt
        ? "completed"
        : status === "pending_club_to"
        ? "current"
        : status === "rejected"
        ? "rejected"
        : fromClubApprovedAt || !requiresFromClub
        ? "pending"
        : "pending",
      date: toClubApprovedAt || undefined,
    });

    // Federation approval
    steps.push({
      label: "Persetujuan Federasi",
      status:
        status === "approved"
          ? "completed"
          : status === "pending_federation"
          ? "current"
          : status === "rejected"
          ? "rejected"
          : toClubApprovedAt
          ? "pending"
          : "pending",
      date: approvedAt || undefined,
    });

    // ITC if required
    if (status === "awaiting_itc" || status === "approved") {
      steps.push({
        label: "Penerbitan ITC",
        status: status === "approved" ? "completed" : "current",
      });
    }

    return steps;
  };

  const steps = getSteps();

  const getIcon = (status: ApprovalStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "skipped":
        return <UserCheck className="h-5 w-5 text-green-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ApprovalStep["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Selesai</Badge>;
      case "current":
        return <Badge variant="secondary">Sedang Diproses</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "skipped":
        return <Badge variant="outline" className="border-green-500 text-green-600">Free Agent</Badge>;
      default:
        return <Badge variant="outline">Menunggu</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {isFreeAgentTransfer && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <UserCheck className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Rekrutmen Free Agent:</strong> Pemain ini tidak terikat klub sebelumnya, 
            sehingga proses persetujuan klub asal dilewati secara otomatis.
          </AlertDescription>
        </Alert>
      )}

      <h3 className="text-lg font-semibold">Timeline Approval</h3>

      <div className="relative">
        {steps.map((step, index) => (
          <div key={index} className="relative pb-8 last:pb-0">
            {index < steps.length - 1 && (
              <div
                className={`absolute left-[10px] top-[24px] h-full w-0.5 ${
                  step.status === "completed"
                    ? "bg-green-600"
                    : step.status === "rejected"
                    ? "bg-red-600"
                    : "bg-border"
                }`}
              />
            )}

            <Card className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{getIcon(step.status)}</div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{step.label}</h4>
                    {getStatusBadge(step.status)}
                  </div>

                  {step.date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(step.date), "dd MMMM yyyy, HH:mm", {
                        locale: id,
                      })}
                    </p>
                  )}

                  {step.approver && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Oleh: {step.approver}
                    </p>
                  )}

                  {step.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded-md">
                      {step.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {rejectedReason && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <h4 className="font-semibold text-destructive mb-2">Alasan Penolakan</h4>
          <p className="text-sm">{rejectedReason}</p>
        </Card>
      )}
    </div>
  );
}
