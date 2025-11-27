import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Eye, Trash2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CompetitionDocumentFormDialog } from "./CompetitionDocumentFormDialog";
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
import { useUserRole } from "@/hooks/useUserRole";

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  valid_from: string | null;
  valid_until: string | null;
  verified: boolean | null;
  verified_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
}

interface CompetitionDocumentsTabProps {
  competitionId: string;
  documents: Document[];
  onRefresh: () => void;
}

export function CompetitionDocumentsTab({
  competitionId,
  documents,
  onRefresh,
}: CompetitionDocumentsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAdminFederasi } = useUserRole();

  const handleDelete = async (doc: Document) => {
    setLoading(true);
    try {
      // Delete file from storage
      const filePath = doc.document_url.split("/").pop();
      if (filePath) {
        await supabase.storage
          .from("competition-documents")
          .remove([`${competitionId}/${filePath}`]);
      }

      // Delete record
      const { error } = await supabase
        .from("competition_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast.success("Dokumen berhasil dihapus");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setDeleteDialog(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedDoc) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("competition_documents")
        .update({
          verified: true,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      toast.success("Dokumen berhasil diverifikasi");
      setVerifyDialog(false);
      setSelectedDoc(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("competition_documents")
        .update({
          verified: false,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      toast.success("Dokumen ditolak");
      setRejectDialog(false);
      setSelectedDoc(null);
      setRejectionReason("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (doc: Document) => {
    if (doc.verified === true) {
      return <Badge className="bg-green-500">Terverifikasi</Badge>;
    }
    if (doc.verified === false && doc.rejection_reason) {
      return <Badge variant="destructive">Ditolak</Badge>;
    }
    if (doc.valid_until && new Date(doc.valid_until) < new Date()) {
      return <Badge variant="secondary">Kadaluarsa</Badge>;
    }
    return <Badge variant="outline">Menunggu Verifikasi</Badge>;
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Dokumen Kompetisi</h3>
          <p className="text-sm text-muted-foreground">
            Kelola dokumen terkait kompetisi
          </p>
        </div>
        {!isAdminFederasi && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Dokumen
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-md border">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Belum ada dokumen</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis Dokumen</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead>Berlaku Dari</TableHead>
                <TableHead>Berlaku Hingga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.document_type}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {doc.notes || "-"}
                  </TableCell>
                  <TableCell>
                    {doc.valid_from
                      ? new Date(doc.valid_from).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {doc.valid_until
                      ? new Date(doc.valid_until).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(doc)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.document_url)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.document_url)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdminFederasi && !doc.verified && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setVerifyDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setRejectDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!isAdminFederasi && !doc.verified && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CompetitionDocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        competitionId={competitionId}
        onSuccess={onRefresh}
      />

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDoc && handleDelete(selectedDoc)}
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={verifyDialog} onOpenChange={setVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin dokumen ini sudah sesuai dan dapat diverifikasi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerify} disabled={loading}>
              {loading ? "Memverifikasi..." : "Verifikasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Dokumen</AlertDialogTitle>
            <AlertDialogDescription>
              Silakan berikan alasan penolakan dokumen ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection">Alasan Penolakan *</Label>
              <Textarea
                id="rejection"
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
              {loading ? "Menolak..." : "Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
