import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface PlayerRegistrationApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: any;
  onSuccess: () => void;
}

export default function PlayerRegistrationApprovalDialog({
  open,
  onOpenChange,
  registration,
  onSuccess,
}: PlayerRegistrationApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!registration) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("competition_player_registrations")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (error) throw error;

      toast.success("Pendaftaran pemain disetujui");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error approving registration:", error);
      toast.error("Gagal menyetujui pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("competition_player_registrations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

      if (error) throw error;

      toast.success("Pendaftaran pemain ditolak");
      onSuccess();
      onOpenChange(false);
      setRejectionReason("");
    } catch (error: any) {
      console.error("Error rejecting registration:", error);
      toast.error("Gagal menolak pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  const getPositionBadge = (position: string) => {
    const colors: any = {
      GK: "bg-yellow-500",
      DF: "bg-blue-500",
      MF: "bg-green-500",
      FW: "bg-red-500",
    };
    return (
      <Badge className={colors[position] || "bg-gray-500"}>
        {position}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Pendaftaran Pemain</DialogTitle>
          <DialogDescription>
            Periksa detail pemain sebelum menyetujui atau menolak pendaftaran
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Info */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={registration.player?.photo_url} />
              <AvatarFallback>
                {registration.player?.full_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {registration.player?.full_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {getPositionBadge(registration.player?.position)}
                <Badge variant="outline">
                  #{registration.shirt_number}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {registration.player?.nationality} •{" "}
                {new Date(registration.player?.date_of_birth).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>

          {/* Club Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Klub</Label>
              <div className="flex items-center gap-2 mt-1">
                {registration.club?.logo_url && (
                  <img
                    src={registration.club.logo_url}
                    alt={registration.club.name}
                    className="h-6 w-6 object-contain"
                  />
                )}
                <span className="font-medium">{registration.club?.name}</span>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Tanggal Daftar</Label>
              <p className="font-medium mt-1">
                {new Date(registration.registered_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Rejection Reason */}
          <div>
            <Label htmlFor="rejection_reason">Alasan Penolakan (Opsional)</Label>
            <Textarea
              id="rejection_reason"
              placeholder="Isi jika ingin menolak pendaftaran..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Tolak
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Setujui
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
