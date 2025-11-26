import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statisticsSchema = z.object({
  season: z.string().min(1, "Musim wajib diisi"),
  matches_played: z.string(),
  minutes_played: z.string(),
  goals: z.string(),
  assists: z.string(),
  yellow_cards: z.string(),
  red_cards: z.string(),
});

type StatisticsFormData = z.infer<typeof statisticsSchema>;

interface StatisticsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  statistic?: any;
  onSuccess: () => void;
}

export const StatisticsFormDialog = ({ open, onOpenChange, playerId, statistic, onSuccess }: StatisticsFormDialogProps) => {
  const { toast } = useToast();
  const form = useForm<StatisticsFormData>({
    resolver: zodResolver(statisticsSchema),
    defaultValues: {
      season: "",
      matches_played: "0",
      minutes_played: "0",
      goals: "0",
      assists: "0",
      yellow_cards: "0",
      red_cards: "0",
    },
  });

  useEffect(() => {
    if (statistic) {
      form.reset({
        season: statistic.season,
        matches_played: statistic.matches_played?.toString() || "0",
        minutes_played: statistic.minutes_played?.toString() || "0",
        goals: statistic.goals?.toString() || "0",
        assists: statistic.assists?.toString() || "0",
        yellow_cards: statistic.yellow_cards?.toString() || "0",
        red_cards: statistic.red_cards?.toString() || "0",
      });
    }
  }, [statistic]);

  const onSubmit = async (data: StatisticsFormData) => {
    try {
      const statData = {
        player_id: playerId,
        season: data.season,
        matches_played: parseInt(data.matches_played),
        minutes_played: parseInt(data.minutes_played),
        goals: parseInt(data.goals),
        assists: parseInt(data.assists),
        yellow_cards: parseInt(data.yellow_cards),
        red_cards: parseInt(data.red_cards),
      };

      if (statistic) {
        const { error } = await supabase.from("player_statistics").update(statData).eq("id", statistic.id);
        if (error) throw error;
        toast({ title: "Statistik berhasil diupdate" });
      } else {
        const { error } = await supabase.from("player_statistics").insert(statData);
        if (error) throw error;
        toast({ title: "Statistik berhasil ditambahkan" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan statistik",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{statistic ? "Edit Statistik" : "Tambah Statistik"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="season"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Musim *</FormLabel>
                  <FormControl>
                    <Input placeholder="2024/2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matches_played"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penampilan</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minutes_played"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menit Bermain</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gol</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assists"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assist</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yellow_cards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kartu Kuning</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="red_cards"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kartu Merah</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{statistic ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
