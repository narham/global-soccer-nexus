import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const matchSchema = z.object({
  home_club_id: z.string().min(1, "Tim home wajib dipilih"),
  away_club_id: z.string().min(1, "Tim away wajib dipilih"),
  match_date: z.string().min(1, "Tanggal pertandingan wajib diisi"),
  match_time: z.string().min(1, "Waktu pertandingan wajib diisi"),
  venue: z.string().optional(),
  referee_name: z.string().optional(),
  matchday: z.string().optional(),
  round: z.string().optional(),
  group_name: z.string().optional(),
  status: z.string().optional(),
});

type MatchFormData = z.infer<typeof matchSchema>;

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  match?: any;
  onSuccess: () => void;
}

export const MatchFormDialog = ({ open, onOpenChange, competitionId, match, onSuccess }: MatchFormDialogProps) => {
  const [clubs, setClubs] = useState<any[]>([]);
  const { toast } = useToast();
  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      home_club_id: "",
      away_club_id: "",
      match_date: "",
      match_time: "15:00",
      venue: "",
      referee_name: "",
      matchday: "",
      round: "",
      group_name: "",
      status: "scheduled",
    },
  });

  useEffect(() => {
    fetchClubs();
    if (match) {
      const matchDate = new Date(match.match_date);
      form.reset({
        home_club_id: match.home_club_id,
        away_club_id: match.away_club_id,
        match_date: matchDate.toISOString().split('T')[0],
        match_time: matchDate.toISOString().split('T')[1].substring(0, 5),
        venue: match.venue || "",
        referee_name: match.referee_name || "",
        matchday: match.matchday?.toString() || "",
        round: match.round || "",
        group_name: match.group_name || "",
        status: match.status || "scheduled",
      });
    }
  }, [match]);

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("id, name").order("name");
    setClubs(data || []);
  };

  const onSubmit = async (data: MatchFormData) => {
    try {
      if (data.home_club_id === data.away_club_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Tim home dan away tidak boleh sama",
        });
        return;
      }

      const matchDateTime = new Date(`${data.match_date}T${data.match_time}`);

      const matchData: any = {
        competition_id: competitionId,
        home_club_id: data.home_club_id,
        away_club_id: data.away_club_id,
        match_date: matchDateTime.toISOString(),
        venue: data.venue || null,
        referee_name: data.referee_name || null,
        matchday: data.matchday ? parseInt(data.matchday) : null,
        round: data.round || null,
        group_name: data.group_name || null,
        status: data.status || "scheduled",
      };

      if (match) {
        const { error } = await supabase.from("matches").update(matchData).eq("id", match.id);
        if (error) throw error;
        toast({ title: "Pertandingan berhasil diupdate" });
      } else {
        const { error } = await supabase.from("matches").insert([matchData]);
        if (error) throw error;
        toast({ title: "Pertandingan berhasil dijadwalkan" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan pertandingan",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{match ? "Edit Pertandingan" : "Jadwalkan Pertandingan"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal dan detail pertandingan sesuai standar AFC
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="home_club_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tim Home *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tim home" />
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
                name="away_club_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tim Away *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tim away" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="match_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="match_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu Kickoff *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormDescription>Waktu lokal (WIB/WITA/WIT)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue (Stadion)</FormLabel>
                  <FormControl>
                    <Input placeholder="Stadion Gelora Bung Karno" {...field} />
                  </FormControl>
                  <FormDescription>Harus memenuhi AFC Stadium Requirements</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referee_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wasit Utama</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama wasit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="matchday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matchday</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="round"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round</FormLabel>
                    <FormControl>
                      <Input placeholder="Final" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grup</FormLabel>
                    <FormControl>
                      <Input placeholder="A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      <SelectItem value="scheduled">Dijadwalkan</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="finished">Selesai</SelectItem>
                      <SelectItem value="postponed">Ditunda</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{match ? "Update" : "Jadwalkan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
