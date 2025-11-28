import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const registrationSchema = z.object({
  player_id: z.string().min(1, "Pilih pemain"),
  shirt_number: z.number().min(1).max(99),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface PlayerRegistrationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  competitionId: string;
  registration?: any;
  onSuccess: () => void;
}

export default function PlayerRegistrationFormDialog({
  open,
  onOpenChange,
  clubId,
  competitionId,
  registration,
  onSuccess,
}: PlayerRegistrationFormDialogProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      player_id: "",
      shirt_number: 1,
    },
  });

  useEffect(() => {
    if (open) {
      fetchPlayers();
      if (registration) {
        form.reset({
          player_id: registration.player_id,
          shirt_number: registration.shirt_number,
        });
      } else {
        form.reset({
          player_id: "",
          shirt_number: 1,
        });
      }
    }
  }, [open, registration]);

  const fetchPlayers = async () => {
    try {
      // Fetch players yang belum terdaftar di kompetisi ini
      const { data: allPlayers, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("current_club_id", clubId)
        .eq("registration_status", "approved");

      if (playersError) throw playersError;

      // Fetch already registered players
      const { data: registered, error: regError } = await supabase
        .from("competition_player_registrations")
        .select("player_id")
        .eq("competition_id", competitionId)
        .eq("club_id", clubId);

      if (regError) throw regError;

      const registeredIds = new Set(registered?.map((r) => r.player_id) || []);
      
      // Filter out registered players, unless editing current registration
      const availablePlayers = allPlayers?.filter(
        (p) => !registeredIds.has(p.id) || p.id === registration?.player_id
      ) || [];

      setPlayers(availablePlayers);
    } catch (error: any) {
      console.error("Error fetching players:", error);
      toast.error("Gagal memuat data pemain");
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (registration) {
        // Update
        const { error } = await supabase
          .from("competition_player_registrations")
          .update({
            player_id: data.player_id,
            shirt_number: data.shirt_number,
          })
          .eq("id", registration.id);

        if (error) throw error;
        toast.success("Pendaftaran berhasil diperbarui");
      } else {
        // Insert
        const { error } = await supabase
          .from("competition_player_registrations")
          .insert({
            competition_id: competitionId,
            club_id: clubId,
            player_id: data.player_id,
            shirt_number: data.shirt_number,
            registered_by: user?.id,
          });

        if (error) throw error;
        toast.success("Pemain berhasil didaftarkan");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving registration:", error);
      toast.error(error.message || "Gagal menyimpan pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {registration ? "Edit" : "Daftarkan"} Pemain
          </DialogTitle>
          <DialogDescription>
            Daftarkan pemain klub ke kompetisi dengan nomor punggung yang ditentukan
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="player_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pemain</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pemain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.full_name} - {player.position}
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
              name="shirt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Punggung</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
