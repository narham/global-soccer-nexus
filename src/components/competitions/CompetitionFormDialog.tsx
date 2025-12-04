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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const competitionSchema = z.object({
  name: z.string().min(3, "Nama kompetisi minimal 3 karakter"),
  season: z.string().min(1, "Musim wajib diisi"),
  type: z.enum(["liga", "piala", "youth_league"]),
  format: z.enum(["round_robin", "knockout", "group_knockout"]),
  start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
  end_date: z.string().optional(),
  num_teams: z.string().optional(),
  num_groups: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

interface CompetitionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition?: any;
  onSuccess: () => void;
}

export const CompetitionFormDialog = ({ open, onOpenChange, competition, onSuccess }: CompetitionFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isPanitia } = useUserRole();

  const form = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      name: "",
      season: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      type: "liga",
      format: "round_robin",
      start_date: "",
      end_date: "",
      num_teams: "",
      num_groups: "",
      description: "",
      status: "upcoming",
    },
  });

  useEffect(() => {
    if (competition) {
      form.reset({
        name: competition.name,
        season: competition.season,
        type: competition.type,
        format: competition.format,
        start_date: competition.start_date,
        end_date: competition.end_date || "",
        num_teams: competition.num_teams?.toString() || "",
        num_groups: competition.num_groups?.toString() || "",
        description: competition.description || "",
        status: competition.status || "upcoming",
      });
    }
  }, [competition]);

  const onSubmit = async (data: CompetitionFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const competitionData: any = {
        name: data.name,
        season: data.season,
        type: data.type,
        format: data.format,
        start_date: data.start_date,
        end_date: data.end_date || null,
        num_teams: data.num_teams ? parseInt(data.num_teams) : null,
        num_groups: data.num_groups ? parseInt(data.num_groups) : null,
        description: data.description || null,
        status: data.status || "upcoming",
      };

      if (competition) {
        const { error } = await supabase
          .from("competitions")
          .update(competitionData)
          .eq("id", competition.id);
        if (error) throw error;
        toast({ title: "Kompetisi berhasil diupdate" });
      } else {
        // Set created_by and approval_status for new competitions
        if (isPanitia) {
          competitionData.created_by = user?.id;
          competitionData.approval_status = "pending";
        } else {
          // Admin federasi competitions are auto-approved
          competitionData.approval_status = "approved";
        }
        
        const { error } = await supabase.from("competitions").insert([competitionData]);
        if (error) throw error;
        
        if (isPanitia) {
          toast({ 
            title: "Kompetisi berhasil dibuat",
            description: "Menunggu persetujuan dari Admin Federasi"
          });
        } else {
          toast({ title: "Kompetisi berhasil dibuat" });
        }
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menyimpan kompetisi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedFormat = form.watch("format");
  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{competition ? "Edit Kompetisi" : "Buat Kompetisi Baru"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Kelola kompetisi sesuai regulasi AFC/FIFA
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Informasi Dasar</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nama Kompetisi *</FormLabel>
                      <FormControl>
                        <Input placeholder="Liga 1 Indonesia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          <SelectItem value="upcoming">Akan Datang</SelectItem>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="finished">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Format Kompetisi (Sesuai Regulasi AFC/FIFA)</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenis Kompetisi *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="liga">Liga (AFC/FIFA League Format)</SelectItem>
                          <SelectItem value="piala">Piala (Cup Competition)</SelectItem>
                          <SelectItem value="youth_league">Liga Muda (Youth Tournament)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format Pertandingan *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="round_robin">Round Robin (Home & Away)</SelectItem>
                          <SelectItem value="knockout">Knockout (Single/Two-leg)</SelectItem>
                          <SelectItem value="group_knockout">Grup + Knockout (AFC Format)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedFormat === "round_robin" && "Setiap tim main 2x (H&A)"}
                        {selectedFormat === "knockout" && "Sistem gugur langsung"}
                        {selectedFormat === "group_knockout" && "Fase grup dilanjut knockout"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="num_teams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Tim Peserta</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="18" {...field} />
                      </FormControl>
                      <FormDescription>
                        {selectedType === "liga" && "AFC: min 8 tim, FIFA: 10-20 tim"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedFormat === "group_knockout" && (
                  <FormField
                    control={form.control}
                    name="num_groups"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Grup</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="4" {...field} />
                        </FormControl>
                        <FormDescription>AFC Champions League: 4-8 grup</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Jadwal</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Mulai *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Selesai (Estimasi)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deskripsi kompetisi..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {competition ? "Update" : "Buat Kompetisi"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
