import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const stadiumSchema = z.object({
  name: z.string().min(1, "Nama stadion harus diisi"),
  city: z.string().min(1, "Kota harus diisi"),
  address: z.string().optional(),
  capacity: z.coerce.number().min(1, "Kapasitas harus lebih dari 0"),
  vip_seats: z.coerce.number().optional(),
  media_seats: z.coerce.number().optional(),
  lighting_lux: z.coerce.number().optional(),
  parking_capacity: z.coerce.number().optional(),
  afc_license_status: z.string().default("pending"),
  owner_club_id: z.string().optional(),
  notes: z.string().optional(),
});

type StadiumFormData = z.infer<typeof stadiumSchema>;

interface StadiumFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stadium?: any;
  onSuccess: () => void;
}

export const StadiumFormDialog = ({ open, onOpenChange, stadium, onSuccess }: StadiumFormDialogProps) => {
  const [clubs, setClubs] = useState<any[]>([]);

  const form = useForm<StadiumFormData>({
    resolver: zodResolver(stadiumSchema),
    defaultValues: {
      name: "",
      city: "",
      capacity: 10000,
      afc_license_status: "pending",
    },
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (stadium) {
      form.reset({
        name: stadium.name || "",
        city: stadium.city || "",
        address: stadium.address || "",
        capacity: stadium.capacity || 10000,
        vip_seats: stadium.vip_seats,
        media_seats: stadium.media_seats,
        lighting_lux: stadium.lighting_lux,
        parking_capacity: stadium.parking_capacity,
        afc_license_status: stadium.afc_license_status || "pending",
        owner_club_id: stadium.owner_club_id || "",
        notes: stadium.notes || "",
      });
    } else {
      form.reset({
        name: "",
        city: "",
        capacity: 10000,
        afc_license_status: "pending",
      });
    }
  }, [stadium, form]);

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("id, name").order("name");
    setClubs(data || []);
  };

  const onSubmit = async (data: StadiumFormData) => {
    try {
      const submitData: any = { ...data };
      if (stadium) {
        const { error } = await supabase.from("stadiums").update(submitData).eq("id", stadium.id);
        if (error) throw error;
        toast.success("Stadion berhasil diperbarui");
      } else {
        const { error } = await supabase.from("stadiums").insert(submitData);
        if (error) throw error;
        toast.success("Stadion berhasil ditambahkan");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(stadium ? "Gagal memperbarui stadion" : "Gagal menambahkan stadion");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stadium ? "Edit Stadion" : "Tambah Stadion"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Stadion</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kota</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kapasitas</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Alamat</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="vip_seats" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kursi VIP</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="media_seats" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kursi Media</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lighting_lux" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pencahayaan (Lux)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="owner_club_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Klub Pemilik</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih klub" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="afc_license_status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Lisensi AFC</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit">{stadium ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
