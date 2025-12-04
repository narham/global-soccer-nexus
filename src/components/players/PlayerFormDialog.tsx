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
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { NIKInput } from "@/components/players/NIKInput";
import { PlayerExistsDialog } from "@/components/players/PlayerExistsDialog";

const playerSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  nik: z.string().optional(),
  place_of_birth: z.string().optional(),
  date_of_birth: z.string().min(1, "Tanggal lahir wajib diisi"),
  nationality: z.string().min(2, "Kewarganegaraan wajib diisi"),
  position: z.enum(["GK", "DF", "MF", "FW"]),
  shirt_number: z.string().optional(),
  height_cm: z.string().optional(),
  weight_kg: z.string().optional(),
  preferred_foot: z.string().optional(),
  current_club_id: z.string().optional(),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  market_value: z.string().optional(),
  injury_status: z.enum(["fit", "cedera", "pemulihan"]).optional(),
  transfer_status: z.string().optional(),
  photo_url: z.string().optional(),
}).refine((data) => {
  // NIK wajib untuk WNI
  if (data.nationality === "Indonesia" && (!data.nik || data.nik.length !== 16)) {
    return false;
  }
  return true;
}, {
  message: "NIK wajib diisi (16 digit) untuk Warga Negara Indonesia",
  path: ["nik"],
});

type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: any;
  onSuccess: () => void;
}

export const PlayerFormDialog = ({ open, onOpenChange, player, onSuccess }: PlayerFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);
  const [existingPlayer, setExistingPlayer] = useState<any>(null);
  const [showExistsDialog, setShowExistsDialog] = useState(false);
  const { toast } = useToast();
  const { isAdminKlub, clubId } = useUserRole();

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      full_name: "",
      nik: "",
      place_of_birth: "",
      date_of_birth: "",
      nationality: "Indonesia",
      position: "MF",
      shirt_number: "",
      height_cm: "",
      weight_kg: "",
      preferred_foot: "",
      current_club_id: isAdminKlub ? (clubId || "") : "",
      contract_start: "",
      contract_end: "",
      market_value: "",
      injury_status: "fit",
      transfer_status: "not_available",
      photo_url: "",
    },
  });

  useEffect(() => {
    fetchClubs();
    if (player) {
      form.reset({
        full_name: player.full_name,
        nik: player.nik || "",
        place_of_birth: player.place_of_birth || "",
        date_of_birth: player.date_of_birth,
        nationality: player.nationality,
        position: player.position,
        shirt_number: player.shirt_number?.toString() || "",
        height_cm: player.height_cm?.toString() || "",
        weight_kg: player.weight_kg?.toString() || "",
        preferred_foot: player.preferred_foot || "",
        current_club_id: player.current_club_id || "",
        contract_start: player.contract_start || "",
        contract_end: player.contract_end || "",
        market_value: player.market_value?.toString() || "",
        injury_status: player.injury_status || "fit",
        transfer_status: player.transfer_status || "not_available",
        photo_url: player.photo_url || "",
      });
    }
  }, [player]);

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("id, name").order("name");
    setClubs(data || []);
  };

  const onSubmit = async (data: PlayerFormData) => {
    setLoading(true);
    try {
      // Check for duplicate NIK only for new players (not editing)
      if (!player && data.nik && data.nationality === "Indonesia") {
        const { data: existing, error: checkError } = await supabase
          .from("players")
          .select("id, full_name, nik, current_club_id, clubs:current_club_id(name)")
          .eq("nik", data.nik)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          // NIK already exists - show dialog
          setExistingPlayer({
            id: existing.id,
            full_name: existing.full_name,
            nik: existing.nik,
            club_name: existing.clubs?.name || "Free Agent",
            current_club_id: existing.current_club_id,
          });
          setShowExistsDialog(true);
          setLoading(false);
          return;
        }
      }

      // Get current user for registered_by field
      const { data: { user } } = await supabase.auth.getUser();

      const playerData: any = {
        full_name: data.full_name,
        nik: data.nik || null,
        place_of_birth: data.place_of_birth || null,
        date_of_birth: data.date_of_birth,
        nationality: data.nationality,
        position: data.position,
        shirt_number: data.shirt_number ? parseInt(data.shirt_number) : null,
        height_cm: data.height_cm ? parseInt(data.height_cm) : null,
        weight_kg: data.weight_kg ? parseInt(data.weight_kg) : null,
        market_value: data.market_value ? parseFloat(data.market_value) : null,
        current_club_id: isAdminKlub && clubId ? clubId : (data.current_club_id || null),
        preferred_foot: data.preferred_foot || null,
        contract_start: data.contract_start || null,
        contract_end: data.contract_end || null,
        injury_status: data.injury_status || "fit",
        transfer_status: isAdminKlub && player ? player.transfer_status : (data.transfer_status || "not_available"),
        photo_url: data.photo_url || null,
        // Set registration status to pending for club admin new players
        ...(isAdminKlub && !player ? { 
          registration_status: 'pending',
          registered_by: user?.id 
        } : {}),
      };

      if (player) {
        const { error } = await supabase.from("players").update(playerData).eq("id", player.id);
        if (error) throw error;
        toast({ 
          title: "Pemain berhasil diupdate",
          description: `Data ${data.full_name} berhasil diperbarui.`
        });
      } else {
        const { error } = await supabase.from("players").insert([playerData]);
        if (error) throw error;
        toast({ 
          title: "Pemain berhasil didaftarkan",
          description: isAdminKlub 
            ? `${data.full_name} berhasil didaftarkan. Menunggu persetujuan Admin Federasi.`
            : `${data.full_name} berhasil didaftarkan ke klub.`
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = () => {
    setShowExistsDialog(false);
    onOpenChange(false);
    // Trigger transfer dialog with player info
    window.dispatchEvent(new CustomEvent('openTransferDialog', { 
      detail: { 
        playerId: existingPlayer.id,
        fromClubId: existingPlayer.current_club_id,
      } 
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player ? "Edit Pemain" : "Registrasi Pemain Baru"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Kelola data pemain sesuai standar FIFA/AFC
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Identitas (Input Pertama)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Kewarganegaraan *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* NIK Input - PERTAMA & WAJIB untuk WNI */}
              {form.watch("nationality") === "Indonesia" && (
                <FormField
                  control={form.control}
                  name="nik"
                  render={({ field }) => (
                    <FormItem>
                      <NIKInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        onValidationChange={(isValid, dateOfBirth) => {
                          if (isValid && dateOfBirth) {
                            form.setValue("date_of_birth", dateOfBirth.toISOString().split("T")[0]);
                          }
                        }}
                        disabled={!!player}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Biodata Lengkap</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nama Lengkap *</FormLabel>
                      <FormControl>
                        <Input placeholder="Sesuai dokumen identitas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Lahir *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={form.watch("nationality") === "Indonesia" && !!form.watch("nik")}
                          className={form.watch("nationality") === "Indonesia" && !!form.watch("nik") ? "bg-muted" : ""}
                        />
                      </FormControl>
                      {form.watch("nationality") === "Indonesia" && !!form.watch("nik") && (
                        <p className="text-xs text-muted-foreground">Otomatis dari NIK</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="place_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempat Lahir</FormLabel>
                      <FormControl>
                        <Input placeholder="Kota kelahiran" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Data Fisik</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tinggi (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="175" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Berat (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferred_foot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kaki Dominan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Kanan">Kanan</SelectItem>
                          <SelectItem value="Kiri">Kiri</SelectItem>
                          <SelectItem value="Dua-duanya">Dua-duanya</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Data Sepakbola</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posisi *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GK">GK - Penjaga Gawang</SelectItem>
                          <SelectItem value="DF">DF - Bek</SelectItem>
                          <SelectItem value="MF">MF - Gelandang</SelectItem>
                          <SelectItem value="FW">FW - Penyerang</SelectItem>
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
                      <FormLabel>No. Punggung</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="current_club_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klub Saat Ini</FormLabel>
                      {isAdminKlub ? (
                        <FormControl>
                          <Input 
                            value={clubs.find(c => c.id === clubId)?.name || "Klub Anda"} 
                            disabled 
                            className="bg-muted"
                          />
                        </FormControl>
                      ) : (
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
                      )}
                      {isAdminKlub && (
                        <p className="text-xs text-muted-foreground">
                          Pemain otomatis terdaftar ke klub Anda
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Kontrak & Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contract_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mulai Kontrak</FormLabel>
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
                      <FormLabel>Akhir Kontrak</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="market_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Value (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="1000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="injury_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Cedera</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fit">Fit</SelectItem>
                          <SelectItem value="cedera">Cedera</SelectItem>
                          <SelectItem value="pemulihan">Pemulihan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transfer_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Transfer</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isAdminKlub}
                      >
                        <FormControl>
                          <SelectTrigger className={isAdminKlub ? "bg-muted" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_available">Tidak Tersedia</SelectItem>
                          <SelectItem value="available">Tersedia</SelectItem>
                          <SelectItem value="on_loan">Dipinjamkan</SelectItem>
                          <SelectItem value="pending_transfer">Dalam Proses Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                      {isAdminKlub && (
                        <p className="text-xs text-muted-foreground">
                          Hanya Admin Federasi yang dapat mengubah status transfer
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {player ? "Update" : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <PlayerExistsDialog
        open={showExistsDialog}
        onOpenChange={setShowExistsDialog}
        existingPlayer={existingPlayer}
        onTransfer={handleTransfer}
      />
    </Dialog>
  );
};
