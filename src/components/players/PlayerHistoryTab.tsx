import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { HistoryFormDialog } from "./HistoryFormDialog";
import { TableActions } from "../TableActions";

interface PlayerHistoryTabProps {
  playerId: string;
}

export const PlayerHistoryTab = ({ playerId }: PlayerHistoryTabProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, [playerId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("player_history")
        .select(`
          *,
          clubs:club_id (name, logo_url)
        `)
        .eq("player_id", playerId)
        .order("from_date", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat riwayat",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hist: any) => {
    try {
      const { error } = await supabase.from("player_history").delete().eq("id", hist.id);
      if (error) throw error;
      toast({ title: "Riwayat berhasil dihapus" });
      fetchHistory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus riwayat",
        description: error.message,
      });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Free Transfer";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Timeline Riwayat Klub</h3>
          <Button onClick={() => { setSelectedHistory(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Riwayat
          </Button>
        </div>

        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada data riwayat klub</p>
        ) : (
          <div className="space-y-4">
            {history.map((hist, index) => (
              <div key={hist.id} className="flex gap-4 relative">
                {index !== history.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative z-10">
                  <span className="text-sm font-semibold text-primary">{index + 1}</span>
                </div>
                <Card className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{hist.clubs?.name}</h4>
                        {!hist.to_date && (
                          <Badge variant="default">Aktif Sekarang</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(hist.from_date), "dd MMM yyyy", { locale: id })} -{" "}
                        {hist.to_date ? format(new Date(hist.to_date), "dd MMM yyyy", { locale: id }) : "Sekarang"}
                      </p>
                      {hist.transfer_fee && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Transfer Fee:</span>{" "}
                          <span className="font-semibold">{formatCurrency(hist.transfer_fee)}</span>
                        </p>
                      )}
                    </div>
                    <TableActions
                      onEdit={() => { setSelectedHistory(hist); setDialogOpen(true); }}
                      onDelete={() => handleDelete(hist)}
                      itemName={hist.clubs?.name}
                    />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </Card>

      <HistoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playerId={playerId}
        history={selectedHistory}
        onSuccess={fetchHistory}
      />
    </div>
  );
};
