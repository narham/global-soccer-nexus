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

const lineupSchema = z.object({
  player_id: z.string().min(1, "Pemain wajib dipilih"),
  position_type: z.string().min(1, "Tipe posisi wajib dipilih"),
  position: z.string().min(1, "Posisi wajib dipilih"),
  shirt_number: z.string().min(1, "Nomor punggung wajib diisi"),
  formation_position: z.string().optional(),
});

type LineupFormData = z.infer<typeof lineupSchema>;

interface LineupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  clubId: string;
  clubName: string;
  lineup?: any;
  onSuccess: () => void;
}

export const LineupFormDialog = ({ open, onOpenChange, matchId, clubId, clubName, lineup, onSuccess }: LineupFormDialogProps) => {
  const [players, setPlayers] = useState<any[]>([]);
  const { toast } = useToast();
  const form = useForm<LineupFormData>({
    resolver: zodResolver(lineupSchema),
    defaultValues: {
      player_id: "",
      position_type: "starting",
      position: "",
      shirt_number: "",
      formation_position: "",
    },
  });

  useEffect(() => {
    fetchPlayers();
  }, [clubId]);

  useEffect(() => {
    if (lineup) {
      form.reset({
        player_id: lineup.player_id,
        position_type: lineup.position_type,
        position: lineup.position,
        shirt_number: lineup.shirt_number?.toString() || "",
        formation_position: lineup.formation_position?.toString() || "",
      });
    }
  }, [lineup]);

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("players")
      .select("id, full_name, shirt_number, position")
      .eq("current_club_id", clubId)
      .eq("registration_status", "approved")
      .order("shirt_number");
    setPlayers(data || []);
  };

  const onSubmit = async (data: LineupFormData) => {
    try {
      const lineupData = {
        match_id: matchId,
        club_id: clubId,
        player_id: data.player_id,
        position_type: data.position_type,
        position: data.position,
        shirt_number: parseInt(data.shirt_number),
        formation_position: data.formation_position ? parseInt(data.formation_position) : null,
      };

      if (lineup) {
        const { error } = await supabase.from("match_lineups").update(lineupData).eq("id", lineup.id);
        if (error) throw error;
        toast({ title: "Line-up berhasil diupdate" });
      } else {
        const { error } = await supabase.from("match_lineups").insert([lineupData]);
        if (error) throw error;
        toast({ title: "Pemain berhasil ditambahkan ke line-up" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan line-up",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lineup ? "Edit" : "Tambah"} Pemain - {clubName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="player_id"
              render={({ field }) => (
                <FormItem>
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
                          #{player.shirt_number} - {player.full_name} ({player.position})
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
              name="position_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="starting">Starting XI</SelectItem>
                      <SelectItem value="bench">Cadangan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posisi *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih posisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="GK">GK - Kiper</SelectItem>
                        <SelectItem value="RB">RB - Bek Kanan</SelectItem>
                        <SelectItem value="CB">CB - Bek Tengah</SelectItem>
                        <SelectItem value="LB">LB - Bek Kiri</SelectItem>
                        <SelectItem value="RWB">RWB - Wing Back Kanan</SelectItem>
                        <SelectItem value="LWB">LWB - Wing Back Kiri</SelectItem>
                        <SelectItem value="CDM">CDM - Gelandang Bertahan</SelectItem>
                        <SelectItem value="CM">CM - Gelandang Tengah</SelectItem>
                        <SelectItem value="CAM">CAM - Gelandang Serang</SelectItem>
                        <SelectItem value="RM">RM - Gelandang Kanan</SelectItem>
                        <SelectItem value="LM">LM - Gelandang Kiri</SelectItem>
                        <SelectItem value="RW">RW - Sayap Kanan</SelectItem>
                        <SelectItem value="LW">LW - Sayap Kiri</SelectItem>
                        <SelectItem value="CF">CF - Penyerang Tengah</SelectItem>
                        <SelectItem value="ST">ST - Striker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shirt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Punggung *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="formation_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urutan Formasi (1-11 untuk starting)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{lineup ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
