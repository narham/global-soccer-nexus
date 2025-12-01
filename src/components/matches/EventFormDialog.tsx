import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  player_out_id: z.string().optional(),
  card_type: z.string().optional(),
  goal_type: z.string().optional(),
  var_decision_type: z.string().optional(),
  red_card_reason: z.string().optional(),
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
      player_out_id: "",
      card_type: "",
      goal_type: "",
      var_decision_type: "",
      red_card_reason: "",
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
        player_out_id: event.player_out_id || "",
        card_type: event.card_type || "",
        goal_type: event.goal_type || "",
        var_decision_type: event.var_decision_type || "",
        red_card_reason: event.red_card_reason || "",
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
        player_out_id: data.player_out_id || null,
        card_type: data.card_type || null,
        goal_type: data.goal_type || null,
        var_decision_type: data.var_decision_type || null,
        red_card_reason: data.red_card_reason || null,
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
          <DialogDescription>
            Catat event pertandingan sesuai IFAB Laws of the Game dan FIFA Match Protocol.
          </DialogDescription>
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
                      <SelectItem value="own_goal">⚽ Gol Bunuh Diri</SelectItem>
                      <SelectItem value="penalty_scored">⚽ Penalti Berhasil</SelectItem>
                      <SelectItem value="penalty_missed">❌ Penalti Gagal</SelectItem>
                      <SelectItem value="yellow_card">🟨 Kartu Kuning</SelectItem>
                      <SelectItem value="red_card">🟥 Kartu Merah</SelectItem>
                      <SelectItem value="second_yellow">🟨🟥 Kartu Kuning Kedua</SelectItem>
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

            {(selectedEventType === "goal" || selectedEventType === "penalty_scored") && (
              <FormField
                control={form.control}
                name="goal_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Gol</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis gol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open_play">Open Play</SelectItem>
                        <SelectItem value="penalty">Penalti</SelectItem>
                        <SelectItem value="free_kick">Tendangan Bebas</SelectItem>
                        <SelectItem value="header">Sundulan</SelectItem>
                        <SelectItem value="counter_attack">Serangan Balik</SelectItem>
                        <SelectItem value="set_piece">Set Piece</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedEventType === "red_card" && (
              <FormField
                control={form.control}
                name="red_card_reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan Kartu Merah</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih alasan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="violent_conduct">Violent Conduct</SelectItem>
                        <SelectItem value="dogso">DOGSO (Denial of Goal Scoring Opportunity)</SelectItem>
                        <SelectItem value="second_yellow">Second Yellow Card</SelectItem>
                        <SelectItem value="offensive_language">Offensive Language</SelectItem>
                        <SelectItem value="serious_foul_play">Serious Foul Play</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedEventType === "substitution" && (
              <>
                <FormField
                  control={form.control}
                  name="player_out_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pemain Keluar *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClubId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pemain keluar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              #{player.shirt_number} - {player.full_name}
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
                  name="player_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pemain Masuk *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClubId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pemain masuk" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {players.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              #{player.shirt_number} - {player.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedEventType === "var" && (
              <FormField
                control={form.control}
                name="var_decision_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Keputusan VAR</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih keputusan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="goal_decision">Goal Decision</SelectItem>
                        <SelectItem value="penalty_decision">Penalty Decision</SelectItem>
                        <SelectItem value="red_card_decision">Red Card Decision</SelectItem>
                        <SelectItem value="mistaken_identity">Mistaken Identity</SelectItem>
                        <SelectItem value="offside">Offside Check</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                    {selectedEventType === "var" && "Jelaskan detail keputusan VAR"}
                    {selectedEventType === "substitution" && "Alasan substitusi (tactical, injury, dll)"}
                    {(selectedEventType === "goal" || selectedEventType === "penalty_scored") && "Detail tambahan tentang gol"}
                    {selectedEventType === "red_card" && "Deskripsi detail pelanggaran"}
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
