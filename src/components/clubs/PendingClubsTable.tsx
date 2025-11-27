import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingClub {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  founded_year: number | null;
  license_status: string | null;
  created_at: string;
}

interface PendingClubsTableProps {
  clubs: PendingClub[];
  onRefresh: () => void;
}

export function PendingClubsTable({ clubs, onRefresh }: PendingClubsTableProps) {
  const navigate = useNavigate();
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedClub, setSelectedClub] = useState<PendingClub | null>(null);
  const [licenseValidUntil, setLicenseValidUntil] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!selectedClub || !licenseValidUntil) {
      toast.error("Tanggal kadaluarsa lisensi wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("clubs")
        .update({
          license_status: "active",
          license_valid_until: licenseValidUntil,
        })
        .eq("id", selectedClub.id);

      if (error) throw error;

      toast.success(`Lisensi klub ${selectedClub.name} telah disetujui`);
      setApprovalDialog(false);
      setSelectedClub(null);
      setLicenseValidUntil("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClub || !rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("clubs")
        .update({
          license_status: "rejected",
        })
        .eq("id", selectedClub.id);

      if (error) throw error;

      toast.success(`Lisensi klub ${selectedClub.name} telah ditolak`);
      setRejectDialog(false);
      setSelectedClub(null);
      setRejectionReason("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (clubs.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Tidak ada klub yang menunggu persetujuan</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Klub</TableHead>
              <TableHead>Nama Pendek</TableHead>
              <TableHead>Kota</TableHead>
              <TableHead>Tahun Berdiri</TableHead>
              <TableHead>Tanggal Daftar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clubs.map((club) => (
              <TableRow key={club.id}>
                <TableCell className="font-medium">{club.name}</TableCell>
                <TableCell>{club.short_name || "-"}</TableCell>
                <TableCell>{club.city || "-"}</TableCell>
                <TableCell>{club.founded_year || "-"}</TableCell>
                <TableCell>
                  {new Date(club.created_at).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Pending</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/clubs/${club.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedClub(club);
                        setApprovalDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Setujui
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedClub(club);
                        setRejectDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approval Dialog */}
      <AlertDialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Lisensi Klub</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyetujui lisensi untuk klub <strong>{selectedClub?.name}</strong>.
              Silakan tentukan tanggal kadaluarsa lisensi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="license-valid-until">Berlaku Hingga *</Label>
              <Input
                id="license-valid-until"
                type="date"
                value={licenseValidUntil}
                onChange={(e) => setLicenseValidUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={loading}>
              {loading ? "Memproses..." : "Setujui"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <AlertDialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Lisensi Klub</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menolak lisensi untuk klub <strong>{selectedClub?.name}</strong>.
              Silakan berikan alasan penolakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Alasan Penolakan *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={loading}>
              {loading ? "Memproses..." : "Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
