import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PlayerRegistrationValidationTable from "./PlayerRegistrationValidationTable";
import PlayerRegistrationApprovalDialog from "./PlayerRegistrationApprovalDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface CompetitionPlayerValidationTabProps {
  competitionId: string;
}

export default function CompetitionPlayerValidationTab({
  competitionId,
}: CompetitionPlayerValidationTabProps) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    fetchRegistrations();
  }, [competitionId]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("competition_player_registrations")
        .select(`
          *,
          player:players(*),
          club:clubs(*)
        `)
        .eq("competition_id", competitionId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      toast.error("Gagal memuat data pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (registration: any) => {
    setSelectedRegistration(registration);
    setDialogOpen(true);
  };

  const filteredRegistrations = registrations.filter(
    (reg) => filter === "all" || reg.status === filter
  );

  const counts = {
    pending: registrations.filter((r) => r.status === "pending").length,
    approved: registrations.filter((r) => r.status === "approved").length,
    rejected: registrations.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">
            Menunggu
            {counts.pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Disetujui
            <Badge variant="secondary" className="ml-2">
              {counts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Ditolak
            <Badge variant="secondary" className="ml-2">
              {counts.rejected}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            Semua
            <Badge variant="secondary" className="ml-2">
              {registrations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <PlayerRegistrationValidationTable
            registrations={filteredRegistrations}
            loading={loading}
            onApprove={handleApprove}
          />
        </TabsContent>
      </Tabs>

      <PlayerRegistrationApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        registration={selectedRegistration}
        onSuccess={fetchRegistrations}
      />
    </div>
  );
}
