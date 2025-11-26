import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

const formSchema = z.object({
  document_type: z.string().min(1, "Pilih jenis dokumen"),
  notes: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "Ukuran file maksimal 10MB")
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      "Format file harus PDF, JPG, atau PNG"
    ),
});

type FormData = z.infer<typeof formSchema>;

interface TransferDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferId: string;
  onSuccess: () => void;
}

export function TransferDocumentFormDialog({
  open,
  onOpenChange,
  transferId,
  onSuccess,
}: TransferDocumentFormDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload file to storage
      const fileExt = data.file.name.split(".").pop();
      const fileName = `${transferId}/${data.document_type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("transfer-documents")
        .upload(fileName, data.file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { error: dbError } = await supabase
        .from("transfer_documents")
        .insert({
          transfer_id: transferId,
          document_type: data.document_type,
          document_url: fileName,
          uploaded_by: user.id,
          notes: data.notes || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Berhasil",
        description: "Dokumen berhasil diupload",
      });

      form.reset();
      setSelectedFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Dokumen Transfer</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Dokumen</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis dokumen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="contract">Kontrak Pemain</SelectItem>
                      <SelectItem value="itc">ITC (International Transfer Certificate)</SelectItem>
                      <SelectItem value="medical_certificate">Sertifikat Kesehatan</SelectItem>
                      <SelectItem value="clearance">Surat Bebas Transfer</SelectItem>
                      <SelectItem value="passport">Paspor/KTP</SelectItem>
                      <SelectItem value="other">Dokumen Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>File Dokumen</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            setSelectedFile(file);
                          }
                        }}
                        {...field}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Format: PDF, JPG, PNG (Max 10MB)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tambahkan catatan untuk dokumen ini"
                      {...field}
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
                disabled={uploading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
