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

const statsSchema = z.object({
  possession: z.string().optional(),
  shots: z.string().optional(),
  shots_on_target: z.string().optional(),
  passes: z.string().optional(),
  pass_accuracy: z.string().optional(),
  tackles: z.string().optional(),
  fouls: z.string().optional(),
  corners: z.string().optional(),
  offsides: z.string().optional(),
  saves: z.string().optional(),
  crosses: z.string().optional(),
  clearances: z.string().optional(),
  interceptions: z.string().optional(),
  duels_won: z.string().optional(),
});

type StatsFormData = z.infer<typeof statsSchema>;

interface StatsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  clubId: string;
  clubName: string;
  stats?: any;
  onSuccess: () => void;
}

export const StatsFormDialog = ({ open, onOpenChange, matchId, clubId, clubName, stats, onSuccess }: StatsFormDialogProps) => {
  const { toast } = useToast();
  const form = useForm<StatsFormData>({
    resolver: zodResolver(statsSchema),
    defaultValues: {
      possession: "0",
      shots: "0",
      shots_on_target: "0",
      passes: "0",
      pass_accuracy: "0",
      tackles: "0",
      fouls: "0",
      corners: "0",
      offsides: "0",
      saves: "0",
      crosses: "0",
      clearances: "0",
      interceptions: "0",
      duels_won: "0",
    },
  });

  useEffect(() => {
    if (stats) {
      form.reset({
        possession: stats.possession?.toString() || "0",
        shots: stats.shots?.toString() || "0",
        shots_on_target: stats.shots_on_target?.toString() || "0",
        passes: stats.passes?.toString() || "0",
        pass_accuracy: stats.pass_accuracy?.toString() || "0",
        tackles: stats.tackles?.toString() || "0",
        fouls: stats.fouls?.toString() || "0",
        corners: stats.corners?.toString() || "0",
        offsides: stats.offsides?.toString() || "0",
        saves: stats.saves?.toString() || "0",
        crosses: stats.crosses?.toString() || "0",
        clearances: stats.clearances?.toString() || "0",
        interceptions: stats.interceptions?.toString() || "0",
        duels_won: stats.duels_won?.toString() || "0",
      });
    }
  }, [stats]);

  const onSubmit = async (data: StatsFormData) => {
    try {
      const statsData = {
        match_id: matchId,
        club_id: clubId,
        possession: parseInt(data.possession || "0"),
        shots: parseInt(data.shots || "0"),
        shots_on_target: parseInt(data.shots_on_target || "0"),
        passes: parseInt(data.passes || "0"),
        pass_accuracy: parseInt(data.pass_accuracy || "0"),
        tackles: parseInt(data.tackles || "0"),
        fouls: parseInt(data.fouls || "0"),
        corners: parseInt(data.corners || "0"),
        offsides: parseInt(data.offsides || "0"),
        saves: parseInt(data.saves || "0"),
        crosses: parseInt(data.crosses || "0"),
        clearances: parseInt(data.clearances || "0"),
        interceptions: parseInt(data.interceptions || "0"),
        duels_won: parseInt(data.duels_won || "0"),
      };

      if (stats) {
        const { error } = await supabase.from("match_statistics").update(statsData).eq("id", stats.id);
        if (error) throw error;
        toast({ title: "Statistik berhasil diupdate" });
      } else {
        const { error } = await supabase.from("match_statistics").insert([statsData]);
        if (error) throw error;
        toast({ title: "Statistik berhasil ditambahkan" });
      }

      onSuccess();
      onOpenChange(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Input Statistik - {clubName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="possession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penguasaan Bola (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pass_accuracy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Akurasi Passing (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="85" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Shots</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shots_on_target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shots On Target</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saves"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saves</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Passes</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="400" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="crosses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crosses</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tackles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tackles</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="18" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interceptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interceptions</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clearances"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clearances</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fouls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fouls</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="8" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="corners"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corners</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="offsides"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offsides</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duels_won"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duels Won</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="45" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{stats ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
