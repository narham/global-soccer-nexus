import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PlayerRegistrationReviewProps {
  player: any;
  onUpdate: () => void;
}

export const PlayerRegistrationReview = ({ 
  player, 
  onUpdate 
}: PlayerRegistrationReviewProps) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  if (player.registration_status !== 'pending') {
    return null;
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("players")
        .update({
          registration_status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", player.id);

      if (error) throw error;

      toast({
        title: "Registrasi Disetujui",
        description: `Pemain ${player.full_name} telah disetujui dan dapat bermain.`,
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyetujui registrasi",
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
        title: "Alasan penolakan wajib diisi",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("players")
        .update({
          registration_status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", player.id);

      if (error) throw error;

      toast({
        title: "Registrasi Ditolak",
        description: "Klub dapat memperbaiki data dan mengajukan kembali.",
      });
      
      onUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menolak registrasi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Review Registrasi Pemain
        </CardTitle>
        <CardDescription>
          Periksa kelengkapan data dan persyaratan pemain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Checklist Review:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Data biodata lengkap dan sesuai</li>
              <li>NIK valid (16 digit untuk WNI)</li>
              <li>Tanggal lahir sesuai dengan NIK</li>
              <li>Foto pemain tersedia</li>
              <li>Data fisik dan posisi jelas</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="rejection-reason">Catatan / Alasan Penolakan</Label>
          <Textarea
            id="rejection-reason"
            placeholder="Masukkan alasan jika menolak registrasi..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1"
            variant="default"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Setujui Registrasi
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
            variant="destructive"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Tolak Registrasi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
