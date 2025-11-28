import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const reportSchema = z.object({
  report_content: z.string().min(10, "Laporan harus minimal 10 karakter"),
  attendance_estimate: z.number().optional(),
  pitch_quality: z.string().optional(),
  weather_notes: z.string().optional(),
  discipline_summary: z.string().optional(),
});

const incidentSchema = z.object({
  minute: z.number().min(0).max(120),
  type: z.string().min(1, "Tipe insiden wajib diisi"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  severity: z.enum(["minor", "moderate", "severe"]),
});

type ReportFormData = z.infer<typeof reportSchema>;
type IncidentData = z.infer<typeof incidentSchema>;

interface RefereeMatchReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  refereeId: string;
  onSuccess: () => void;
}

export function RefereeMatchReportDialog({
  open,
  onOpenChange,
  match,
  refereeId,
  onSuccess,
}: RefereeMatchReportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [newIncident, setNewIncident] = useState<Partial<IncidentData>>({
    minute: 0,
    type: "",
    description: "",
    severity: "minor",
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      report_content: "",
      attendance_estimate: undefined,
      pitch_quality: "",
      weather_notes: "",
      discipline_summary: "",
    },
  });

  useEffect(() => {
    if (open && match) {
      fetchExistingReport();
    }
  }, [open, match]);

  const fetchExistingReport = async () => {
    try {
      const { data, error } = await supabase
        .from("match_reports")
        .select("*")
        .eq("match_id", match.id)
        .eq("referee_id", refereeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingReport(data);
        form.reset({
          report_content: data.report_content || "",
          attendance_estimate: data.attendance_estimate || undefined,
          pitch_quality: data.pitch_quality || "",
          weather_notes: data.weather_notes || "",
          discipline_summary: data.discipline_summary || "",
        });

        // Parse incidents from JSON
        if (data.incidents && Array.isArray(data.incidents)) {
          setIncidents(data.incidents as IncidentData[]);
        }
      }
    } catch (error: any) {
      console.error("Error fetching report:", error);
    }
  };

  const addIncident = () => {
    if (!newIncident.type || !newIncident.description) {
      toast.error("Lengkapi data insiden");
      return;
    }

    setIncidents([...incidents, newIncident as IncidentData]);
    setNewIncident({
      minute: 0,
      type: "",
      description: "",
      severity: "minor",
    });
  };

  const removeIncident = (index: number) => {
    setIncidents(incidents.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReportFormData) => {
    try {
      setLoading(true);

      const reportData = {
        match_id: match.id,
        referee_id: refereeId,
        report_content: data.report_content,
        attendance_estimate: data.attendance_estimate || null,
        pitch_quality: data.pitch_quality || null,
        weather_notes: data.weather_notes || null,
        discipline_summary: data.discipline_summary || null,
        incidents: incidents.length > 0 ? incidents : null,
        submitted_at: existingReport?.submitted_at || null,
      };

      if (existingReport) {
        // Update existing report
        const { error } = await supabase
          .from("match_reports")
          .update(reportData)
          .eq("id", existingReport.id);

        if (error) throw error;
        toast.success("Laporan berhasil diperbarui");
      } else {
        // Insert new report
        const { error } = await supabase
          .from("match_reports")
          .insert(reportData);

        if (error) throw error;
        toast.success("Laporan berhasil disimpan");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving report:", error);
      toast.error("Gagal menyimpan laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    try {
      setLoading(true);

      if (!existingReport) {
        toast.error("Simpan laporan terlebih dahulu");
        return;
      }

      const { error } = await supabase
        .from("match_reports")
        .update({ submitted_at: new Date().toISOString() })
        .eq("id", existingReport.id);

      if (error) throw error;

      toast.success("Laporan berhasil disubmit ke Admin");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error("Gagal submit laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Laporan Pertandingan Wasit</DialogTitle>
          <DialogDescription>
            Buat laporan pertandingan sesuai AFC Match Officials Protocol
          </DialogDescription>
        </DialogHeader>

        {/* Match Info */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {match.home_club?.name} {match.home_score ?? 0} - {match.away_score ?? 0} {match.away_club?.name}
            </h3>
            <Badge variant="outline">{match.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {match.competition?.name} • {format(new Date(match.match_date), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
          </p>
          {match.venue && (
            <p className="text-sm text-muted-foreground">Venue: {match.venue}</p>
          )}
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Report Content */}
            <FormField
              control={form.control}
              name="report_content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Isi Laporan Pertandingan *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Jelaskan jalannya pertandingan, keputusan penting yang diambil, dan observasi umum..."
                      rows={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Match Conditions */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="attendance_estimate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimasi Penonton</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pitch_quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kualitas Lapangan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weather_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kondisi Cuaca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Cerah, Hujan, dll" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Discipline Summary */}
            <FormField
              control={form.control}
              name="discipline_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ringkasan Disiplin (Kartu, Pelanggaran)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Jelaskan kartu kuning/merah yang diberikan dan alasannya..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Incidents Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Insiden Pertandingan</h3>
                <Badge variant="secondary">{incidents.length} insiden</Badge>
              </div>

              {incidents.length > 0 && (
                <div className="space-y-2">
                  {incidents.map((incident, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Badge variant="outline" className="min-w-[60px]">
                        {incident.minute}'
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium">{incident.type}</div>
                        <div className="text-sm text-muted-foreground">{incident.description}</div>
                      </div>
                      <Badge
                        variant={
                          incident.severity === "severe"
                            ? "destructive"
                            : incident.severity === "moderate"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {incident.severity}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIncident(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Incident Form */}
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <h4 className="font-medium text-sm">Tambah Insiden Baru</h4>
                <div className="grid grid-cols-4 gap-3">
                  <Input
                    type="number"
                    placeholder="Menit"
                    value={newIncident.minute}
                    onChange={(e) =>
                      setNewIncident({ ...newIncident, minute: parseInt(e.target.value) })
                    }
                  />
                  <Input
                    placeholder="Tipe (Kekerasan, dll)"
                    value={newIncident.type}
                    onChange={(e) => setNewIncident({ ...newIncident, type: e.target.value })}
                  />
                  <Input
                    placeholder="Deskripsi"
                    value={newIncident.description}
                    onChange={(e) =>
                      setNewIncident({ ...newIncident, description: e.target.value })
                    }
                  />
                  <Select
                    value={newIncident.severity}
                    onValueChange={(value: any) =>
                      setNewIncident({ ...newIncident, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addIncident}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Insiden
                </Button>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Tutup
              </Button>
              <div className="flex gap-2">
                <Button type="submit" variant="outline" disabled={loading}>
                  {loading ? "Menyimpan..." : existingReport ? "Update Draft" : "Simpan Draft"}
                </Button>
                {existingReport && !existingReport.submitted_at && (
                  <Button type="button" onClick={handleSubmitReport} disabled={loading}>
                    Submit ke Admin
                  </Button>
                )}
                {existingReport?.submitted_at && (
                  <Badge variant="default">Sudah Disubmit</Badge>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
