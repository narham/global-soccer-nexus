import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TransferDocumentFormDialog } from "./TransferDocumentFormDialog";
import { TransferDocumentPreview } from "./TransferDocumentPreview";
import { Upload, Eye, CheckCircle, XCircle, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransferDocument {
  id: string;
  document_type: string;
  document_url: string;
  verified: boolean;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  uploaded_by: string | null;
}

interface TransferDocumentsTabProps {
  transferId: string;
  canUpload: boolean;
  canVerify: boolean;
}

export function TransferDocumentsTab({ transferId, canUpload, canVerify }: TransferDocumentsTabProps) {
  const [documents, setDocuments] = useState<TransferDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<TransferDocument | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [transferId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("transfer_documents")
        .select("*")
        .eq("transfer_id", transferId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contract: "Kontrak Pemain",
      itc: "ITC (International Transfer Certificate)",
      medical_certificate: "Sertifikat Kesehatan",
      clearance: "Surat Bebas Transfer",
      passport: "Paspor/KTP",
      other: "Dokumen Lainnya",
    };
    return labels[type] || type;
  };

  const requiredDocuments = ["contract", "medical_certificate", "passport"];
  const uploadedTypes = documents.map(d => d.document_type);
  const missingRequired = requiredDocuments.filter(type => !uploadedTypes.includes(type));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan tombol upload */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dokumen Transfer</h3>
          <p className="text-sm text-muted-foreground">
            Upload dan kelola dokumen pendukung transfer
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Dokumen
          </Button>
        )}
      </div>

      {/* Peringatan dokumen yang belum diupload */}
      {missingRequired.length > 0 && (
        <Card className="p-4 border-amber-500/50 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                Dokumen Wajib Belum Lengkap
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Dokumen berikut harus diupload:
              </p>
              <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 mt-2">
                {missingRequired.map(type => (
                  <li key={type}>{getDocumentTypeLabel(type)}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Daftar dokumen */}
      {documents.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada dokumen yang diupload</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{getDocumentTypeLabel(doc.document_type)}</h4>
                    {doc.verified ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Terverifikasi
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Belum Diverifikasi
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Diupload {format(new Date(doc.created_at), "dd MMMM yyyy HH:mm", { locale: id })}
                  </p>
                  {doc.verified_at && (
                    <p className="text-sm text-muted-foreground">
                      Diverifikasi {format(new Date(doc.verified_at), "dd MMMM yyyy HH:mm", { locale: id })}
                    </p>
                  )}
                  {doc.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded-md">{doc.notes}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TransferDocumentFormDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        transferId={transferId}
        onSuccess={() => {
          fetchDocuments();
          setUploadDialogOpen(false);
        }}
      />

      {previewDoc && (
        <TransferDocumentPreview
          document={previewDoc}
          open={!!previewDoc}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          canVerify={canVerify}
          onVerified={fetchDocuments}
        />
      )}
    </div>
  );
}
