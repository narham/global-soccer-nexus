import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompetitionApprovalBadge } from "@/components/panitia/CompetitionApprovalBadge";
import { CompetitionApprovalDialog } from "./CompetitionApprovalDialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitionApprovalTab() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from("competitions")
        .select(`
          *,
          creator:profiles!competitions_created_by_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat kompetisi",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesStatus = statusFilter === "all" || comp.approval_status === statusFilter;
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = (competition: any) => {
    setSelectedCompetition(competition);
    setApprovalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cari kompetisi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-1/3"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCompetitions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada kompetisi ditemukan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCompetitions.map((competition) => (
            <Card key={competition.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle>{competition.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Dibuat oleh: {competition.creator?.full_name || competition.creator?.email}</span>
                      <span>•</span>
                      <span>{format(new Date(competition.created_at), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <CompetitionApprovalBadge status={competition.approval_status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipe:</span>{" "}
                      <span className="font-medium">{competition.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>{" "}
                      <span className="font-medium">{competition.format}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Musim:</span>{" "}
                      <span className="font-medium">{competition.season}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tanggal:</span>{" "}
                      <span className="font-medium">
                        {format(new Date(competition.start_date), "dd MMM yyyy")} -{" "}
                        {competition.end_date ? format(new Date(competition.end_date), "dd MMM yyyy") : "TBD"}
                      </span>
                    </div>
                  </div>

                  {competition.rejection_reason && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">Alasan Penolakan:</p>
                      <p className="text-sm text-muted-foreground mt-1">{competition.rejection_reason}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant={competition.approval_status === "pending" ? "default" : "outline"}
                      onClick={() => handleApprove(competition)}
                    >
                      {competition.approval_status === "pending" ? "Review" : "Lihat Detail"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCompetition && (
        <CompetitionApprovalDialog
          open={approvalOpen}
          onOpenChange={setApprovalOpen}
          competition={selectedCompetition}
          onSuccess={fetchCompetitions}
        />
      )}
    </div>
  );
}
