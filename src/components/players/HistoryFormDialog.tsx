import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const historySchema = z.object({
  club_id: z.string().min(1, "Klub wajib dipilih"),
  from_date: z.string().min(1, "Tanggal bergabung wajib diisi"),
  to_date: z.string().optional(),
  transfer_fee: z.string().optional(),
});

type HistoryFormData = z.infer<typeof historySchema>;

interface HistoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  history?: any;
  onSuccess: () => void;
}

export const HistoryFormDialog = ({ open, onOpenChange, playerId, history, onSuccess }: HistoryFormDialogProps) => {
  const [clubs, setClubs] = useState<any[]>([]);
  const { toast } = useToast();
  const form = useForm<HistoryFormData>({
    resolver: zodResolver(historySchema),
    defaultValues: {
      club_id: "",
      from_date: "",
      to_date: "",
      transfer_fee: "",
    },
  });

  useEffect(() => {
    fetchClubs();
    if (history) {
      form.reset({
        club_id: history.club_id,
        from_date: history.from_date,
        to_date: history.to_date || "",
        transfer_fee: history.transfer_fee?.toString() || "",
      });
    }
  }, [history]);

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("id, name").order("name");
    setClubs(data || []);
  };

  const onSubmit = async (data: HistoryFormData) => {
    try {
      const histData = {
        player_id: playerId,
        club_id: data.club_id,
        from_date: data.from_date,
        to_date: data.to_date || null,
        transfer_fee: data.transfer_fee ? parseFloat(data.transfer_fee) : null,
      };

      if (history) {
        const { error } = await supabase.from("player_history").update(histData).eq("id", history.id);
        if (error) throw error;
        toast({ title: "Riwayat berhasil diupdate" });
      } else {
        const { error } = await supabase.from("player_history").insert(histData);
        if (error) throw error;
        toast({ title: "Riwayat berhasil ditambahkan" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan riwayat",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{history ? "Edit Riwayat Klub" : "Tambah Riwayat Klub"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="club_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Klub *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih klub" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Bergabung *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Keluar</FormLabel>
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
              name="transfer_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Fee (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Kosongkan jika free transfer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{history ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
