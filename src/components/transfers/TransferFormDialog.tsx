import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const transferSchema = z.object({
  player_id: z.string().min(1, "Pemain wajib dipilih"),
  from_club_id: z.string().optional(),
  to_club_id: z.string().min(1, "Klub tujuan wajib dipilih"),
  transfer_type: z.enum(["permanent", "loan", "free", "end_of_contract"]),
  transfer_fee: z.string().optional(),
  contract_start: z.string().min(1, "Tanggal kontrak mulai wajib diisi"),
  contract_end: z.string().min(1, "Tanggal kontrak berakhir wajib diisi"),
  loan_end_date: z.string().optional(),
  requires_itc: z.boolean().default(false),
  notes: z.string().optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer?: any;
  onSuccess: () => void;
}

export const TransferFormDialog = ({ open, onOpenChange, transfer, onSuccess }: TransferFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      player_id: "",
      from_club_id: "",
      to_club_id: "",
      transfer_type: "permanent",
      transfer_fee: "",
      contract_start: "",
      contract_end: "",
      loan_end_date: "",
      requires_itc: false,
      notes: "",
    },
  });

  useEffect(() => {
    fetchPlayers();
    fetchClubs();
    fetchActiveWindow();
    
    if (transfer) {
      form.reset({
        player_id: transfer.player_id,
        from_club_id: transfer.from_club_id || "",
        to_club_id: transfer.to_club_id,
        transfer_type: transfer.transfer_type,
        transfer_fee: transfer.transfer_fee?.toString() || "",
        contract_start: transfer.contract_start,
        contract_end: transfer.contract_end,
        loan_end_date: transfer.loan_end_date || "",
        requires_itc: transfer.requires_itc || false,
        notes: transfer.notes || "",
      });
    }
  }, [transfer, open]);

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("id, full_name, position, current_club_id, clubs:current_club_id(name)")
      .order("full_name");
    setPlayers(data || []);
  };

  const fetchClubs = async () => {
    const { data } = await supabase
      .from("clubs")
      .select("id, name")
      .order("name");
    setClubs(data || []);
  };

  const fetchActiveWindow = async () => {
    const { data } = await supabase
      .from("transfer_windows")
      .select("*")
      .eq("is_active", true)
      .single();
    setActiveWindow(data);
  };

  const transferType = form.watch("transfer_type");
  const requiresITC = form.watch("requires_itc");

  const onSubmit = async (data: TransferFormData) => {
    if (!activeWindow) {
      toast({
        variant: "destructive",
        title: "Transfer Window Tidak Aktif",
        description: "Tidak ada transfer window yang aktif saat ini.",
      });
      return;
    }

    setLoading(true);
    try {
      // Determine initial status based on transfer flow
      const hasFromClub = !!data.from_club_id;
      const initialStatus = hasFromClub ? "pending_club_from" : "pending_club_to";

      const transferData: any = {
        player_id: data.player_id,
        from_club_id: data.from_club_id || null,
        to_club_id: data.to_club_id,
        transfer_window_id: activeWindow.id,
        transfer_type: data.transfer_type,
        transfer_fee: data.transfer_fee ? parseFloat(data.transfer_fee) : null,
        contract_start: data.contract_start,
        contract_end: data.contract_end,
        loan_end_date: data.transfer_type === "loan" ? data.loan_end_date : null,
        requires_itc: data.requires_itc,
        itc_status: data.requires_itc ? "requested" : "not_required",
        status: initialStatus,
        notes: data.notes || null,
      };

      if (transfer) {
        const { error } = await supabase
          .from("player_transfers")
          .update(transferData)
          .eq("id", transfer.id);
        if (error) throw error;
        toast({ title: "Transfer berhasil diupdate" });
      } else {
        const { error } = await supabase.from("player_transfers").insert([transferData]);
        if (error) throw error;
        toast({ 
          title: "Transfer berhasil diajukan",
          description: "Transfer menunggu persetujuan federasi"
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan transfer",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transfer ? "Edit Transfer" : "Ajukan Transfer Pemain"}</DialogTitle>
        </DialogHeader>

        {!activeWindow && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada transfer window yang aktif. Transfer hanya bisa dilakukan dalam periode transfer window.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Informasi Pemain & Klub</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="player_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Pemain *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pemain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.full_name} - {player.position} ({player.clubs?.name || "Free Agent"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="from_club_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dari Klub</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kosongkan jika free agent" />
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
                <FormField
                  control={form.control}
                  name="to_club_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ke Klub *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih klub tujuan" />
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
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Detail Transfer (FIFA TMS)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transfer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Transfer *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="permanent">Permanen</SelectItem>
                          <SelectItem value="loan">Pinjaman</SelectItem>
                          <SelectItem value="free">Bebas Transfer</SelectItem>
                          <SelectItem value="end_of_contract">Habis Kontrak</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transfer_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biaya Transfer (IDR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormDescription>Kosongkan jika bebas transfer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontrak Mulai *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kontrak Berakhir *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {transferType === "loan" && (
                  <FormField
                    control={form.control}
                    name="loan_end_date"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Akhir Masa Pinjaman *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>Wajib diisi untuk transfer pinjaman</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">ITC (International Transfer Certificate)</h3>
              <FormField
                control={form.control}
                name="requires_itc"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Transfer Internasional</FormLabel>
                      <FormDescription>
                        Aktifkan jika transfer melibatkan klub dari negara berbeda (memerlukan ITC dari FIFA)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {requiresITC && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Transfer ini memerlukan ITC approval dari FIFA. Proses akan otomatis mengirim request ke FIFA TMS.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Catatan tambahan..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading || !activeWindow}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {transfer ? "Update" : "Ajukan Transfer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
