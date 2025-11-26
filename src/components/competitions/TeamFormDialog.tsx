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

const teamSchema = z.object({
  club_id: z.string().min(1, "Klub wajib dipilih"),
  seed: z.string().optional(),
  group_name: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  team?: any;
  onSuccess: () => void;
}

export const TeamFormDialog = ({ open, onOpenChange, competitionId, team, onSuccess }: TeamFormDialogProps) => {
  const [clubs, setClubs] = useState<any[]>([]);
  const { toast } = useToast();
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      club_id: "",
      seed: "",
      group_name: "",
    },
  });

  useEffect(() => {
    fetchClubs();
    if (team) {
      form.reset({
        club_id: team.club_id,
        seed: team.seed?.toString() || "",
        group_name: team.group_name || "",
      });
    }
  }, [team]);

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("id, name").order("name");
    setClubs(data || []);
  };

  const onSubmit = async (data: TeamFormData) => {
    try {
      const teamData = {
        competition_id: competitionId,
        club_id: data.club_id,
        seed: data.seed ? parseInt(data.seed) : null,
        group_name: data.group_name || null,
      };

      if (team) {
        const { error } = await supabase.from("competition_teams").update(teamData).eq("id", team.id);
        if (error) throw error;
        toast({ title: "Peserta berhasil diupdate" });
      } else {
        const { error } = await supabase.from("competition_teams").insert([teamData]);
        if (error) throw error;
        toast({ title: "Peserta berhasil ditambahkan" });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan peserta",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? "Edit Peserta" : "Tambah Peserta"}</DialogTitle>
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
            <FormField
              control={form.control}
              name="seed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seed (Peringkat)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Digunakan untuk pembagian pot dalam undian grup
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="group_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grup (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A" {...field} />
                  </FormControl>
                  <FormDescription>
                    Kosongkan untuk generate otomatis
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit">{team ? "Update" : "Simpan"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
