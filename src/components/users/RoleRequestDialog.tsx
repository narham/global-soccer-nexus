import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";

interface RoleRequestDialogProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RoleRequestDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: RoleRequestDialogProps) {
  const { toast } = useToast();
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin_federasi":
        return "Admin Federasi";
      case "admin_klub":
        return "Admin Klub";
      case "panitia":
        return "Panitia";
      case "wasit":
        return "Wasit";
      default:
        return role;
    }
  };

  const handleApprove = async () => {
    if (!request) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update request status
      const { error: requestError } = await supabase
        .from("role_requests")
        .update({
          status: "approved",
          reviewer_id: user.id,
          reviewer_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (requestError) throw requestError;

      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", request.user_id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({
            role: request.requested_role,
            club_id: request.requested_club_id,
          })
          .eq("user_id", request.user_id);

        if (roleError) throw roleError;
      } else {
        // Insert new role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: request.user_id,
            role: request.requested_role,
            club_id: request.requested_club_id,
          });

        if (roleError) throw roleError;
      }

      // Send email notification
      try {
        await supabase.functions.invoke("send-role-notification", {
          body: {
            email: request.profile?.email,
            name: request.profile?.full_name || request.profile?.email,
            role: request.requested_role,
            status: "approved",
            reviewerNotes: reviewNotes,
            clubName: request.clubs?.name,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast({
        title: "Berhasil",
        description: "Permintaan role telah disetujui",
      });

      onSuccess();
      onOpenChange(false);
      setReviewNotes("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    if (!reviewNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Mohon berikan alasan penolakan",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("role_requests")
        .update({
          status: "rejected",
          reviewer_id: user.id,
          reviewer_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke("send-role-notification", {
          body: {
            email: request.profile?.email,
            name: request.profile?.full_name || request.profile?.email,
            role: request.requested_role,
            status: "rejected",
            reviewerNotes: reviewNotes,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast({
        title: "Berhasil",
        description: "Permintaan role telah ditolak",
      });

      onSuccess();
      onOpenChange(false);
      setReviewNotes("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  const isPending = request.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Permintaan Role</DialogTitle>
          <DialogDescription>
            Review dan kelola permintaan role dari pengguna
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm">Informasi Pemohon</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Nama Lengkap</Label>
                <div className="font-medium">{request.profile?.full_name || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <div className="text-sm">{request.profile?.email || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Nomor Telepon</Label>
                <div className="text-sm">{request.profile?.phone || "-"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Tanggal Registrasi</Label>
                <div className="text-sm">
                  {request.profile?.created_at 
                    ? new Date(request.profile.created_at).toLocaleDateString('id-ID')
                    : "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Role Diminta</Label>
              <div>
                <Badge variant="outline" className="mt-1">
                  {getRoleLabel(request.requested_role)}
                </Badge>
              </div>
            </div>

            {request.clubs && (
              <div>
                <Label className="text-muted-foreground">Klub</Label>
                <div className="font-medium">{request.clubs.name}</div>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div>
                <Badge
                  variant={
                    request.status === "approved"
                      ? "default"
                      : request.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                  className="mt-1"
                >
                  {request.status === "pending"
                    ? "Menunggu"
                    : request.status === "approved"
                    ? "Disetujui"
                    : "Ditolak"}
                </Badge>
              </div>
            </div>
          </div>

          {request.reason && (
            <div>
              <Label className="text-muted-foreground">Alasan</Label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {request.reason}
              </div>
            </div>
          )}

          <Separator />

          {isPending && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="review-notes">Catatan Review</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Tambahkan catatan untuk keputusan Anda..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <Button onClick={handleApprove} disabled={isSubmitting}>
                  <Check className="mr-2 h-4 w-4" />
                  Setujui
                </Button>
              </div>
            </div>
          )}

          {!isPending && request.reviewer_notes && (
            <div>
              <Label className="text-muted-foreground">Catatan Reviewer</Label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {request.reviewer_notes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
