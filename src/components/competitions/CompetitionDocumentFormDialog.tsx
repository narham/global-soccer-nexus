import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload } from "@/components/clubs/FileUpload";

const formSchema = z.object({
  document_type: z.string().min(1, "Jenis dokumen wajib dipilih"),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  notes: z.string().optional(),
});

const DOCUMENT_TYPES = [
  "Surat Izin Penyelenggaraan",
  "Dokumen Keamanan",
  "Perjanjian Sponsor",
  "Anggaran Dana",
  "Laporan Pertanggungjawaban",
  "Peraturan Kompetisi",
  "Surat Tugas Panitia",
  "Lainnya",
];

interface CompetitionDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onSuccess: () => void;
}

export function CompetitionDocumentFormDialog({
  open,
  onOpenChange,
  competitionId,
  onSuccess,
}: CompetitionDocumentFormDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      document_type: "",
      valid_from: "",
      valid_until: "",
      notes: "",
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setSelectedFile(file);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${competitionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("competition-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("competition-documents")
        .getPublicUrl(filePath);

      setFileUrl(data.publicUrl);
      toast.success("File berhasil diunggah");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFileUrl(null);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!fileUrl) {
      toast.error("Silakan unggah file dokumen terlebih dahulu");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("competition_documents").insert({
        competition_id: competitionId,
        document_type: values.document_type,
        document_url: fileUrl,
        valid_from: values.valid_from || null,
        valid_until: values.valid_until || null,
        notes: values.notes || null,
        uploaded_by: user?.id,
      });

      if (error) throw error;

      toast.success("Dokumen berhasil ditambahkan");
      onOpenChange(false);
      form.reset();
      setFileUrl(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Dokumen Kompetisi</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Dokumen *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis dokumen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>File Dokumen *</FormLabel>
              <FileUpload
                onFileSelect={handleFileUpload}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Dari</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Hingga</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan untuk dokumen ini..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploading || !fileUrl}>
                {uploading ? "Mengunggah..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
