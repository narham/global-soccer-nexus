import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefereeAssignmentDialog } from "@/components/referees/RefereeAssignmentDialog";
import { useUserRole } from "@/hooks/useUserRole";

interface MatchOfficialsTabProps {
  matchId: string;
}

export function MatchOfficialsTab({ matchId }: MatchOfficialsTabProps) {
  const [officials, setOfficials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAdminFederasi, isPanitia } = useUserRole();

  useEffect(() => {
    fetchOfficials();
  }, [matchId]);

  const fetchOfficials = async () => {
    try {
      const { data, error } = await supabase
        .from("match_officials")
        .select(`
          *,
          referee:referees(*)
        `)
        .eq("match_id", matchId);

      if (error) throw error;
      setOfficials(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data petugas",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOfficial = async (officialId: string) => {
    if (!confirm("Hapus penugasan wasit ini?")) return;

    try {
      const { error } = await supabase
        .from("match_officials")
        .delete()
        .eq("id", officialId);

      if (error) throw error;

      toast({
        title: "Penugasan dihapus",
        description: "Wasit berhasil dihapus dari pertandingan",
      });

      fetchOfficials();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus penugasan",
        description: error.message,
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      referee: "Wasit Utama",
      assistant_1: "Asisten Wasit 1",
      assistant_2: "Asisten Wasit 2",
      fourth_official: "Wasit Keempat",
      var: "VAR",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Petugas Pertandingan</h3>
          <p className="text-sm text-muted-foreground">
            Wasit dan petugas yang ditugaskan untuk pertandingan ini
          </p>
        </div>
        {(isAdminFederasi || isPanitia) && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tugaskan Wasit
          </Button>
        )}
      </div>

      {officials.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Belum ada wasit yang ditugaskan
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {officials.map((official) => (
            <Card key={official.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {getRoleLabel(official.role)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {official.referee.full_name}
                    </p>
                  </div>
                  <Badge
                    variant={official.confirmed ? "default" : "secondary"}
                  >
                    {official.confirmed ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <X className="mr-1 h-3 w-3" />
                    )}
                    {official.confirmed ? "Dikonfirmasi" : "Menunggu"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lisensi:</span>
                    <span className="font-medium">
                      {official.referee.license_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Lisensi:</span>
                    <span>{official.referee.license_number || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pengalaman:</span>
                    <span>{official.referee.experience_years || 0} tahun</span>
                  </div>
                  {official.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground text-xs">Catatan:</p>
                      <p className="text-sm">{official.notes}</p>
                    </div>
                  )}
                </div>
                {(isAdminFederasi || isPanitia) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemoveOfficial(official.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Hapus Penugasan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RefereeAssignmentDialog
        open={dialogOpen}
        matchId={matchId}
        existingOfficials={officials}
        onClose={(saved) => {
          setDialogOpen(false);
          if (saved) fetchOfficials();
        }}
      />
    </div>
  );
}
