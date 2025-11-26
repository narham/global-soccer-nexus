import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface TransferDocumentPreviewProps {
  document: {
    id: string;
    document_url: string;
    verified: boolean;
    notes: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canVerify: boolean;
  onVerified: () => void;
}

export function TransferDocumentPreview({
  document,
  open,
  onOpenChange,
  canVerify,
  onVerified,
}: TransferDocumentPreviewProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [notes, setNotes] = useState(document.notes || "");
  const { toast } = useToast();

  useEffect(() => {
    fetchFileUrl();
  }, [document.document_url]);

  const fetchFileUrl = async () => {
    try {
      const { data } = await supabase.storage
        .from("transfer-documents")
        .createSignedUrl(document.document_url, 3600); // 1 hour

      if (data) {
        setFileUrl(data.signedUrl);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat dokumen",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verified: boolean) => {
    try {
      setVerifying(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("transfer_documents")
        .update({
          verified,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          notes,
        })
        .eq("id", document.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: verified
          ? "Dokumen telah diverifikasi"
          : "Verifikasi dokumen dibatalkan",
      });

      onVerified();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const fileExtension = document.document_url.split(".").pop()?.toLowerCase();
  const isPdf = fileExtension === "pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview Dokumen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview area */}
          <div className="border rounded-lg overflow-hidden bg-muted min-h-[400px] flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : fileUrl ? (
              isPdf ? (
                <iframe
                  src={fileUrl}
                  className="w-full h-[500px]"
                  title="Document Preview"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt="Document"
                  className="max-w-full max-h-[500px] object-contain"
                />
              )
            ) : (
              <p className="text-muted-foreground">Gagal memuat dokumen</p>
            )}
          </div>

          {/* Verification section */}
          {canVerify && !document.verified && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="notes">Catatan Verifikasi (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan verifikasi..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleVerify(false)}
                  disabled={verifying}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </Button>
                <Button onClick={() => handleVerify(true)} disabled={verifying}>
                  {verifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Verifikasi
                </Button>
              </div>
            </div>
          )}

          {/* Download button */}
          {fileUrl && (
            <div className="flex justify-center">
              <Button variant="outline" asChild>
                <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                  Download Dokumen
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
