import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle, XCircle, FileText, Trophy, Shield } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { RefereeMatchReportDialog } from "@/components/referees/RefereeMatchReportDialog";

export default function RefereesDashboard() {
  const navigate = useNavigate();
  const [referee, setReferee] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    fetchRefereeData();
  }, []);

  const fetchRefereeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch referee profile
      const { data: refData, error: refError } = await supabase
        .from("referees")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (refError) throw refError;
      setReferee(refData);

      // Fetch assignments with match details
      const { data: assignData, error: assignError } = await supabase
        .from("match_officials")
        .select(`
          *,
          matches (
            *,
            home_club:clubs!matches_home_club_id_fkey(id, name, logo_url),
            away_club:clubs!matches_away_club_id_fkey(id, name, logo_url),
            competition:competitions(id, name, logo_url)
          )
        `)
        .eq("referee_id", refData.id)
        .order("created_at", { ascending: false });

      if (assignError) throw assignError;
      setAssignments(assignData || []);
    } catch (error: any) {
      console.error("Error fetching referee data:", error);
      toast.error("Gagal memuat data wasit");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignment = async (assignmentId: string, confirmed: boolean) => {
    try {
      const { error } = await supabase
        .from("match_officials")
        .update({ confirmed })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(confirmed ? "Penugasan dikonfirmasi" : "Penugasan ditolak");
      fetchRefereeData();
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast.error("Gagal mengupdate penugasan");
    }
  };

  const openReportDialog = (assignment: any) => {
    setSelectedMatch(assignment.matches);
    setReportDialogOpen(true);
  };

  const upcomingAssignments = assignments.filter(
    (a) => new Date(a.matches.match_date) >= new Date() && a.confirmed !== false
  );

  const pastAssignments = assignments.filter(
    (a) => new Date(a.matches.match_date) < new Date()
  );

  const pendingAssignments = assignments.filter((a) => a.confirmed === null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Memuat data...</div>
      </div>
    );
  }

  if (!referee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profil Wasit Tidak Ditemukan</CardTitle>
            <CardDescription>
              Anda belum terdaftar sebagai wasit dalam sistem
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Referee Profile Header */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Shield className="h-12 w-12 text-primary" />
          <div className="flex-1">
            <CardTitle>{referee.full_name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline">{referee.license_type}</Badge>
              <span>•</span>
              <span>{referee.license_number}</span>
              {referee.license_valid_until && (
                <>
                  <span>•</span>
                  <span>
                    Berlaku hingga: {format(new Date(referee.license_valid_until), "dd MMM yyyy", { locale: idLocale })}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge variant={referee.status === "active" ? "default" : "secondary"}>
            {referee.status === "active" ? "Aktif" : "Tidak Aktif"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{pastAssignments.length}</div>
              <div className="text-sm text-muted-foreground">Pertandingan Ditangani</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
              <div className="text-sm text-muted-foreground">Penugasan Mendatang</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{referee.experience_years || 0}</div>
              <div className="text-sm text-muted-foreground">Tahun Pengalaman</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Menunggu Konfirmasi ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Mendatang ({upcomingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Riwayat ({pastAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Tidak ada penugasan yang menunggu konfirmasi
              </CardContent>
            </Card>
          ) : (
            pendingAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {assignment.matches.home_club?.name} vs {assignment.matches.away_club?.name}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(assignment.matches.match_date), "EEEE, dd MMMM yyyy · HH:mm", { locale: idLocale })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{assignment.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {assignment.matches.competition?.name} • {assignment.matches.venue || "Venue TBD"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmAssignment(assignment.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmAssignment(assignment.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Konfirmasi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Tidak ada penugasan mendatang
              </CardContent>
            </Card>
          ) : (
            upcomingAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">
                          {assignment.matches.home_club?.name} vs {assignment.matches.away_club?.name}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(assignment.matches.match_date), "EEEE, dd MMMM yyyy · HH:mm", { locale: idLocale })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge>{assignment.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {assignment.matches.competition?.name} • {assignment.matches.venue || "Venue TBD"}
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Dikonfirmasi
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada riwayat penugasan
              </CardContent>
            </Card>
          ) : (
            pastAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {assignment.matches.home_club?.name} {assignment.matches.home_score ?? 0} - {assignment.matches.away_score ?? 0} {assignment.matches.away_club?.name}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(assignment.matches.match_date), "dd MMMM yyyy", { locale: idLocale })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{assignment.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {assignment.matches.competition?.name}
                    </div>
                    {assignment.role === "referee" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReportDialog(assignment)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Laporan Pertandingan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedMatch && (
        <RefereeMatchReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          match={selectedMatch}
          refereeId={referee.id}
          onSuccess={() => {
            toast.success("Laporan berhasil disimpan");
            fetchRefereeData();
          }}
        />
      )}
    </div>
  );
}
