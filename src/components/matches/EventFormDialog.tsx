import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const eventSchema = z.object({
  club_id: z.string().min(1, "Tim wajib dipilih"),
  event_type: z.string().min(1, "Tipe event wajib dipilih"),
  minute: z.string().min(1, "Menit wajib diisi"),
  player_id: z.string().optional(),
  card_type: z.string().optional(),
  description: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  homeClub: any;
  awayClub: any;
  event?: any;
  onSuccess: () => void;
}

export const EventFormDialog = ({ open, onOpenChange, matchId, homeClub, awayClub, event, onSuccess }: EventFormDialogProps) => {
  const [players, setPlayers] = useState<any[]>([]);
  const { toast } = useToast();
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      club_id: "",
      event_type: "",
      minute: "",
      player_id: "",
      card_type: "",
      description: "",
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        club_id: event.club_id,
        event_type: event.event_type,
        minute: event.minute?.toString() || "",
        player_id: event.player_id || "",
        card_type: event.card_type || "",
        description: event.description || "",
      });
    }
  }, [event]);

  const selectedClubId = form.watch("club_id");
  const selectedEventType = form.watch("event_type");

  useEffect(() => {
    if (selectedClubId) {
      fetchPlayers(selectedClubId);
    }
  }, [selectedClubId]);

  const fetchPlayers = async (clubId: string) => {
    const { data } = await supabase
      .from("players")
      .select("id, full_name, shirt_number, position")
      .eq("current_club_id", clubId)
      .order("shirt_number");
    setPlayers(data || []);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      const eventData: any = {
        match_id: matchId,
        club_id: data.club_id,
        event_type: data.event_type,
        minute: parseInt(data.minute),
        player_id: data.player_id || null,
        card_type: data.card_type || null,
        description: data.description || null,
      };

      if (event) {
        const { error } = await supabase.from("match_events").update(eventData).eq("id", event.id);
        if (error) throw error;
        toast({ title: "Event berhasil diupdate" });
      } else {
        const { error } = await supabase.from("match_events").insert([eventData]);
        if (error) throw error;
        toast({ title: "Event berhasil ditambahkan" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan event",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Tambah Event Pertandingan"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="club_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tim *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tim" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={homeClub.id}>{homeClub.name}</SelectItem>
                        <SelectItem value={awayClub.id}>{awayClub.name}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menit *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="45" {...field} />
                    </FormControl>
                    <FormDescription>0-90+ (injury time)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Event *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="goal">⚽ Gol</SelectItem>
                      <SelectItem value="yellow_card">🟨 Kartu Kuning</SelectItem>
                      <SelectItem value="red_card">🟥 Kartu Merah</SelectItem>
                      <SelectItem value="substitution">🔄 Pergantian</SelectItem>
                      <SelectItem value="var">📹 VAR Decision</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="player_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pemain</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClubId}>
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
                  <FormDescription>Pilih tim terlebih dahulu</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(selectedEventType === "yellow_card" || selectedEventType === "red_card") && (
              <FormField
                control={form.control}
                name="card_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kartu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="yellow">Kuning</SelectItem>
                        <SelectItem value="red">Merah</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detail tambahan..." rows={2} {...field} />
                  </FormControl>
                  <FormDescription>
                    {selectedEventType === "var" && "Jelaskan keputusan VAR"}
                    {selectedEventType === "substitution" && "Format: Player OUT → Player IN"}
                    {selectedEventType === "goal" && "Jenis gol (open play, penalty, free kick, dll)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{event ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
