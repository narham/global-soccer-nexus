import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface CompetitionApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: any;
  onSuccess: () => void;
}

export function CompetitionApprovalDialog({
  open,
  onOpenChange,
  competition,
  onSuccess,
}: CompetitionApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  const handleApprove = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("competitions")
        .update({
          approval_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", competition.id);

      if (error) throw error;

      toast({
        title: "Kompetisi Disetujui",
        description: "Kompetisi berhasil disetujui dan dapat dikelola oleh panitia.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyetujui kompetisi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Alasan diperlukan",
        description: "Mohon berikan alasan penolakan",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("competitions")
        .update({
          approval_status: "rejected",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", competition.id);

      if (error) throw error;

      toast({
        title: "Kompetisi Ditolak",
        description: "Kompetisi telah ditolak dengan alasan yang diberikan.",
      });

      onSuccess();
      onOpenChange(false);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menolak kompetisi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Kompetisi</DialogTitle>
          <DialogDescription>
            Review detail kompetisi dan putuskan untuk menyetujui atau menolak
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{competition.name}</h3>
            <p className="text-sm text-muted-foreground">{competition.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Tipe</Label>
              <Badge variant="secondary">{competition.type}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Format</Label>
              <Badge variant="outline">{competition.format}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Musim</Label>
              <p className="font-medium">{competition.season}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Jumlah Tim</Label>
              <p className="font-medium">{competition.num_teams || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal Mulai</Label>
              <p className="font-medium">{format(new Date(competition.start_date), "dd MMM yyyy")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal Selesai</Label>
              <p className="font-medium">
                {competition.end_date ? format(new Date(competition.end_date), "dd MMM yyyy") : "TBD"}
              </p>
            </div>
          </div>

          {competition.approval_status === "pending" && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Alasan Penolakan (Opsional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Berikan alasan jika menolak kompetisi ini..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Tutup
          </Button>
          {competition.approval_status === "pending" && (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Setujui
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
