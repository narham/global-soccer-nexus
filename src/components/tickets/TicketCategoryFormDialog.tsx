import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const categorySchema = z.object({
  category_name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional(),
  price: z.string().min(1, "Harga wajib diisi"),
  total_quota: z.string().min(1, "Kuota wajib diisi"),
  seating_section_id: z.string().optional(),
  status: z.enum(["open", "closed", "sold_out"]),
  sale_start_date: z.string().optional(),
  sale_end_date: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface TicketCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  category?: any;
  onSuccess: () => void;
}

export function TicketCategoryFormDialog({ open, onOpenChange, matchId, category, onSuccess }: TicketCategoryFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      category_name: "",
      description: "",
      price: "",
      total_quota: "",
      seating_section_id: "",
      status: "open",
      sale_start_date: "",
      sale_end_date: "",
    },
  });

  useEffect(() => {
    fetchSections();
    if (category) {
      form.reset({
        category_name: category.category_name,
        description: category.description || "",
        price: category.price?.toString() || "",
        total_quota: category.total_quota?.toString() || "",
        seating_section_id: category.seating_section_id || "",
        status: category.status || "open",
        sale_start_date: category.sale_start_date?.split("T")[0] || "",
        sale_end_date: category.sale_end_date?.split("T")[0] || "",
      });
    } else {
      form.reset({
        category_name: "",
        description: "",
        price: "",
        total_quota: "",
        seating_section_id: "",
        status: "open",
        sale_start_date: "",
        sale_end_date: "",
      });
    }
  }, [category, open]);

  const fetchSections = async () => {
    // Get stadium from match
    const { data: match } = await supabase
      .from("matches")
      .select("venue, home_club_id, clubs:home_club_id(stadium_name)")
      .eq("id", matchId)
      .maybeSingle();

    if (match) {
      const { data } = await supabase
        .from("stadium_seating_sections")
        .select("*, stadiums(name)")
        .eq("is_active", true)
        .order("name");
      setSections(data || []);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    setLoading(true);
    try {
      const categoryData = {
        match_id: matchId,
        category_name: data.category_name,
        description: data.description || null,
        price: parseFloat(data.price),
        total_quota: parseInt(data.total_quota),
        seating_section_id: data.seating_section_id || null,
        status: data.status,
        sale_start_date: data.sale_start_date || null,
        sale_end_date: data.sale_end_date || null,
      };

      if (category) {
        const { error } = await supabase
          .from("match_ticket_categories")
          .update(categoryData)
          .eq("id", category.id);
        if (error) throw error;
        toast({ title: "Kategori tiket berhasil diupdate" });
      } else {
        const { error } = await supabase
          .from("match_ticket_categories")
          .insert([categoryData]);
        if (error) throw error;
        toast({ title: "Kategori tiket berhasil ditambahkan" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Kategori Tiket" : "Tambah Kategori Tiket"}</DialogTitle>
          <DialogDescription>Kelola kategori dan harga tiket pertandingan</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori *</FormLabel>
                  <FormControl>
                    <Input placeholder="VIP, Tribun Utama, dll" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi kategori tiket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga (Rp) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_quota"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kuota *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {sections.length > 0 && (
              <FormField
                control={form.control}
                name="seating_section_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seksi Tempat Duduk</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih seksi (opsional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name} ({section.section_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Buka</SelectItem>
                      <SelectItem value="closed">Tutup</SelectItem>
                      <SelectItem value="sold_out">Habis</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sale_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mulai Penjualan</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Akhir Penjualan</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
