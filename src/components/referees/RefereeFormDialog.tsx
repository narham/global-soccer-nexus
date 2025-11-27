import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  license_number: z.string().optional(),
  license_type: z.string().min(1, "Tipe lisensi wajib dipilih"),
  license_valid_until: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  specialization: z.string().optional(),
  experience_years: z.coerce.number().min(0).optional(),
  status: z.string(),
});

interface RefereeFormDialogProps {
  open: boolean;
  referee?: any;
  onClose: (saved: boolean) => void;
}

export function RefereeFormDialog({
  open,
  referee,
  onClose,
}: RefereeFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      license_number: "",
      license_type: "Nasional",
      license_valid_until: "",
      phone: "",
      email: "",
      specialization: "",
      experience_years: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (referee) {
      form.reset({
        full_name: referee.full_name || "",
        license_number: referee.license_number || "",
        license_type: referee.license_type || "Nasional",
        license_valid_until: referee.license_valid_until || "",
        phone: referee.phone || "",
        email: referee.email || "",
        specialization: referee.specialization || "",
        experience_years: referee.experience_years || 0,
        status: referee.status || "active",
      });
    } else {
      form.reset({
        full_name: "",
        license_number: "",
        license_type: "Nasional",
        license_valid_until: "",
        phone: "",
        email: "",
        specialization: "",
        experience_years: 0,
        status: "active",
      });
    }
  }, [referee, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);

      const insertData: any = {
        full_name: values.full_name,
        license_type: values.license_type,
        status: values.status,
        license_number: values.license_number || null,
        license_valid_until: values.license_valid_until || null,
        phone: values.phone || null,
        email: values.email || null,
        specialization: values.specialization || null,
        experience_years: values.experience_years || 0,
      };

      if (referee) {
        const { error } = await supabase
          .from("referees")
          .update(insertData)
          .eq("id", referee.id);

        if (error) throw error;

        toast({
          title: "Wasit diperbarui",
          description: "Data wasit berhasil diperbarui",
        });
      } else {
        const { error } = await supabase.from("referees").insert([insertData]);

        if (error) throw error;

        toast({
          title: "Wasit ditambahkan",
          description: "Data wasit berhasil ditambahkan",
        });
      }

      onClose(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan wasit",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {referee ? "Edit Wasit" : "Tambah Wasit Baru"}
          </DialogTitle>
          <DialogDescription>
            Kelola data wasit dan informasi lisensi
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap wasit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Lisensi</FormLabel>
                    <FormControl>
                      <Input placeholder="Nomor lisensi wasit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Lisensi *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe lisensi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIFA">FIFA</SelectItem>
                        <SelectItem value="AFC">AFC</SelectItem>
                        <SelectItem value="Nasional">Nasional</SelectItem>
                        <SelectItem value="Provinsi">Provinsi</SelectItem>
                        <SelectItem value="Kabupaten/Kota">Kabupaten/Kota</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Berlaku Sampai</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spesialisasi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih spesialisasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Wasit Utama">Wasit Utama</SelectItem>
                        <SelectItem value="Asisten Wasit">Asisten Wasit</SelectItem>
                        <SelectItem value="Wasit Keempat">Wasit Keempat</SelectItem>
                        <SelectItem value="VAR">VAR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pengalaman (Tahun)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telepon</FormLabel>
                    <FormControl>
                      <Input placeholder="081234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
