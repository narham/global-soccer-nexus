import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransfersTable } from "@/components/TransfersTable";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferFormDialog } from "@/components/transfers/TransferFormDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Transfers = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchTransfers();
    fetchWindows();
  }, []);

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from("player_transfers")
        .select(`
          *,
          player:player_id (full_name, position, photo_url),
          from_club:from_club_id (name, logo_url),
          to_club:to_club_id (name, logo_url),
          transfer_window:transfer_window_id (name, window_type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data transfer",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWindows = async () => {
    try {
      const { data, error } = await supabase
        .from("transfer_windows")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(5);

      if (error) throw error;
      setWindows(data || []);
    } catch (error: any) {
      console.error("Error fetching windows:", error);
    }
  };

  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      transfer.player?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_club?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_club?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transfer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeWindow = windows.find(w => w.is_active);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Transfer Pemain</h2>
          <p className="text-muted-foreground">Sistem transfer sesuai FIFA TMS & ITC</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajukan Transfer
        </Button>
      </div>

      {activeWindow && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Transfer Window Aktif: {activeWindow.name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(activeWindow.start_date).toLocaleDateString("id-ID")} - {new Date(activeWindow.end_date).toLocaleDateString("id-ID")}
              </p>
            </div>
            <Badge className="ml-auto">Aktif</Badge>
          </div>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="pending_club_from">Menunggu Klub Asal</TabsTrigger>
          <TabsTrigger value="pending_club_to">Menunggu Klub Tujuan</TabsTrigger>
          <TabsTrigger value="pending_federation">Menunggu Federasi</TabsTrigger>
          <TabsTrigger value="awaiting_itc">Menunggu ITC</TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pemain atau klub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="rounded-md border">
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? "Tidak ada transfer yang ditemukan" : "Belum ada data transfer"}
                </p>
              </div>
            </div>
          ) : (
            <TransfersTable transfers={filteredTransfers} onRefresh={fetchTransfers} />
          )}
        </TabsContent>
      </Tabs>

      <TransferFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchTransfers}
      />
    </div>
  );
};

export default Transfers;
