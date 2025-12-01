import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ProfileDocumentsTabProps {
  userId: string;
}

interface Document {
  id: string;
  document_type: string;
  document_url: string;
  notes: string | null;
  created_at: string;
}

const documentTypes = [
  "KTP",
  "NPWP",
  "Ijazah",
  "Sertifikat Lisensi",
  "Surat Keterangan",
  "Lainnya",
];

export const ProfileDocumentsTab = ({ userId }: ProfileDocumentsTabProps) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    document_type: "",
    notes: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File terlalu besar",
          description: "Ukuran maksimal 5MB",
        });
        return;
      }
      setNewDoc({ ...newDoc, file });
    }
  };

  const handleUpload = async () => {
    if (!newDoc.file || !newDoc.document_type) {
      toast({
        variant: "destructive",
        title: "Data tidak lengkap",
        description: "Pilih tipe dokumen dan file",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = newDoc.file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}_${newDoc.document_type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-documents")
        .upload(fileName, newDoc.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-documents")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("user_documents")
        .insert({
          user_id: userId,
          document_type: newDoc.document_type,
          document_url: publicUrl,
          notes: newDoc.notes || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Berhasil",
        description: "Dokumen berhasil diupload",
      });

      setNewDoc({ document_type: "", notes: "", file: null });
      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal upload dokumen",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm("Yakin ingin menghapus dokumen ini?")) return;

    try {
      const fileName = doc.document_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("profile-documents")
          .remove([`${userId}/${fileName}`]);
      }

      const { error } = await supabase
        .from("user_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Dokumen berhasil dihapus",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus dokumen",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Memuat dokumen...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Upload Dokumen Baru</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe Dokumen</Label>
            <Select
              value={newDoc.document_type}
              onValueChange={(value) =>
                setNewDoc({ ...newDoc, document_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe dokumen" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">File Dokumen</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <p className="text-sm text-muted-foreground">
              Format: PDF, JPG, PNG. Maksimal 5MB
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={newDoc.notes}
              onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
              placeholder="Tambahkan catatan untuk dokumen ini"
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Dokumen
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Dokumen Tersimpan</h3>
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Belum ada dokumen yang diupload
          </p>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <h4 className="font-medium">{doc.document_type}</h4>
                      {doc.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Diupload:{" "}
                        {format(new Date(doc.created_at), "dd MMMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.document_url, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
