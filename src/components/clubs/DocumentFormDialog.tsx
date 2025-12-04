import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  document?: any;
  onSuccess: () => void;
}

export const DocumentFormDialog = ({ open, onOpenChange, clubId, document, onSuccess }: DocumentFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    document_type: document?.document_type || "",
    document_url: document?.document_url || "",
    valid_from: document?.valid_from || "",
    valid_until: document?.valid_until || "",
    verified: document?.verified || false,
  });

  const documentTypes = [
    "Lisensi AFC",
    "Akta Pendirian",
    "NPWP",
    "Surat Domisili",
    "Surat Izin Usaha",
    "Sertifikat Standar Stadion",
    "Perjanjian Sponsor",
    "Lainnya",
  ];

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${clubId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("club-documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("club-documents")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let documentUrl = formData.document_url;

      // Upload file if selected
      if (selectedFile && uploadTab === "file") {
        documentUrl = await uploadFile(selectedFile);
      }

      if (!documentUrl) {
        toast.error("Please upload a file or provide a URL");
        setLoading(false);
        return;
      }

      const payload = { 
        ...formData, 
        document_url: documentUrl,
        club_id: clubId 
      };

      if (document) {
        const { error } = await supabase
          .from("club_documents")
          .update(payload)
          .eq("id", document.id);

        if (error) throw error;
        toast.success("Dokumen berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("club_documents")
          .insert([payload]);

        if (error) throw error;
        toast.success("Dokumen berhasil ditambahkan");
      }

      setSelectedFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{document ? "Edit Dokumen" : "Tambah Dokumen Baru"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload dan kelola dokumen legal klub
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document_type">Jenis Dokumen *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
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
              <Label>Dokumen *</Label>
              <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "file" | "url")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="url">URL Manual</TabsTrigger>
                </TabsList>
                <TabsContent value="file">
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    onFileRemove={() => setSelectedFile(null)}
                    selectedFile={selectedFile}
                  />
                </TabsContent>
                <TabsContent value="url">
                  <Input
                    id="document_url"
                    value={formData.document_url}
                    onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                    placeholder="https://..."
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Berlaku Dari</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Berlaku Hingga</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="verified"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="verified" className="cursor-pointer">
                Dokumen Terverifikasi
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : document ? "Update" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
