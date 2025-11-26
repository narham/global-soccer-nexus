import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle, XCircle, Eye, Trash2 } from "lucide-react";
import { PlayerDocumentFormDialog } from "./PlayerDocumentFormDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
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

interface PlayerDocumentsTabProps {
  playerId: string;
  clubId: string | null;
}

interface PlayerDocument {
  id: string;
  document_type: string;
  document_url: string;
  valid_from: string | null;
  valid_until: string | null;
  verified: boolean;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export function PlayerDocumentsTab({ playerId, clubId }: PlayerDocumentsTabProps) {
  const { toast } = useToast();
  const { isAdminKlub, isAdminFederasi, clubId: userClubId } = useUserRole();
  const [documents, setDocuments] = useState<PlayerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const canManage = isAdminFederasi || (isAdminKlub && clubId === userClubId);

  useEffect(() => {
    fetchDocuments();
  }, [playerId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('player_documents')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat dokumen",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId: string, verified: boolean, reason?: string) => {
    try {
      const { error } = await supabase
        .from('player_documents')
        .update({
          verified,
          verified_at: verified ? new Date().toISOString() : null,
          verified_by: verified ? (await supabase.auth.getUser()).data.user?.id : null,
          rejection_reason: reason || null,
        })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: verified ? "Dokumen diverifikasi" : "Dokumen ditolak",
        description: verified 
          ? "Dokumen telah diverifikasi dengan sukses" 
          : "Dokumen ditolak",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui status",
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDocId) return;

    try {
      const { error } = await supabase
        .from('player_documents')
        .delete()
        .eq('id', selectedDocId);

      if (error) throw error;

      toast({
        title: "Dokumen dihapus",
        description: "Dokumen berhasil dihapus",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus dokumen",
        description: error.message,
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDocId(null);
    }
  };

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="text-center py-8">Memuat dokumen...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Dokumen Pemain</h3>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Dokumen
          </Button>
        )}
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada dokumen yang diupload
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <CardTitle className="text-base">{doc.document_type}</CardTitle>
                  </div>
                  {doc.verified ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Terverifikasi
                    </Badge>
                  ) : doc.rejection_reason ? (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Ditolak
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Menunggu Verifikasi</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {doc.valid_from && (
                  <p className="text-sm text-muted-foreground">
                    Berlaku: {format(new Date(doc.valid_from), 'dd MMM yyyy', { locale: idLocale })}
                    {doc.valid_until && ` - ${format(new Date(doc.valid_until), 'dd MMM yyyy', { locale: idLocale })}`}
                  </p>
                )}
                {doc.rejection_reason && (
                  <div className="bg-destructive/10 text-destructive p-2 rounded text-sm">
                    <strong>Alasan Penolakan:</strong> {doc.rejection_reason}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(doc.document_url)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat
                  </Button>
                  {isAdminFederasi && !doc.verified && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleVerify(doc.id, true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verifikasi
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const reason = prompt("Alasan penolakan:");
                          if (reason) handleVerify(doc.id, false, reason);
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Tolak
                      </Button>
                    </>
                  )}
                  {isAdminFederasi && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlayerDocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playerId={playerId}
        onSuccess={fetchDocuments}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Dokumen akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
