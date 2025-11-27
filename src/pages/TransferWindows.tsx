import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { TransferWindowFormDialog } from "@/components/transfers/TransferWindowFormDialog";
import { TransferWindowsTable } from "@/components/transfers/TransferWindowsTable";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TransferWindows = () => {
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWindows();
  }, []);

  const fetchWindows = async () => {
    try {
      const { data, error } = await supabase
        .from("transfer_windows")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setWindows(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data transfer windows",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWindows = windows.filter((window) =>
    window.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    window.window_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeWindow = windows.find(w => w.is_active);

  const handleEdit = (window: any) => {
    setEditingWindow(window);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingWindow(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transfer Windows</h2>
          <p className="text-muted-foreground">Kelola periode transfer pemain</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Transfer Window
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari transfer window..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : filteredWindows.length === 0 ? (
        <div className="rounded-md border">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "Tidak ada transfer window yang ditemukan" : "Belum ada transfer window"}
            </p>
          </div>
        </div>
      ) : (
        <TransferWindowsTable 
          windows={filteredWindows} 
          onRefresh={fetchWindows}
          onEdit={handleEdit}
        />
      )}

      <TransferWindowFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSuccess={fetchWindows}
        editingWindow={editingWindow}
      />
    </div>
  );
};

export default TransferWindows;
