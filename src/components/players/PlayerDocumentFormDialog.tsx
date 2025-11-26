import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

const documentTypes = [
  "KTP",
  "Paspor",
  "Kartu Keluarga",
  "Akta Kelahiran",
  "Kontrak Kerja",
  "Surat Kesehatan",
  "Foto Pemain",
  "Ijazah",
  "Sertifikat",
  "Lainnya"
];

const formSchema = z.object({
  document_type: z.string().min(1, "Pilih jenis dokumen"),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

interface PlayerDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  onSuccess: () => void;
}

export function PlayerDocumentFormDialog({
  open,
  onOpenChange,
  playerId,
  onSuccess,
}: PlayerDocumentFormDialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      document_type: "",
      valid_from: "",
      valid_until: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Pilih file",
        description: "Pilih file dokumen untuk diupload",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${playerId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('player-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-documents')
        .getPublicUrl(fileName);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert document record
      const { error: insertError } = await supabase
        .from('player_documents')
        .insert({
          player_id: playerId,
          document_type: values.document_type,
          document_url: publicUrl,
          valid_from: values.valid_from || null,
          valid_until: values.valid_until || null,
          uploaded_by: user?.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Dokumen berhasil diupload",
        description: "Dokumen menunggu verifikasi dari Admin Federasi",
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
      setFile(null);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Dokumen Pemain</DialogTitle>
          <DialogDescription>
            Upload dokumen pemain untuk verifikasi
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Dokumen *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis dokumen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((type) => (
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

            <div>
              <FormLabel>File Dokumen *</FormLabel>
              <div className="mt-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: PDF, JPG, PNG (Maks. 5MB)
                </p>
              </div>
            </div>

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

            <DialogFooter>
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
