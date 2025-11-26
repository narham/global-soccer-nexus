import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { StadiumsTable } from "@/components/stadiums/StadiumsTable";
import { StadiumFormDialog } from "@/components/stadiums/StadiumFormDialog";
import { Skeleton } from "@/components/ui/skeleton";

const Stadiums = () => {
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState<any>(null);

  useEffect(() => {
    fetchStadiums();
  }, []);

  const fetchStadiums = async () => {
    try {
      const { data, error } = await supabase
        .from("stadiums")
        .select("*, owner_club:clubs(name)")
        .order("name");

      if (error) throw error;
      setStadiums(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data stadion");
    } finally {
      setLoading(false);
    }
  };

  const filteredStadiums = stadiums.filter((stadium) =>
    stadium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stadium.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (stadium: any) => {
    setSelectedStadium(stadium);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("stadiums").delete().eq("id", id);
      if (error) throw error;
      toast.success("Stadion berhasil dihapus");
      fetchStadiums();
    } catch (error: any) {
      toast.error("Gagal menghapus stadion");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Stadion</h2>
          <p className="text-muted-foreground">Kelola venue dan fasilitas stadion</p>
        </div>
        <Button onClick={() => { setSelectedStadium(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Stadion
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari stadion..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filteredStadiums.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "Tidak ada stadion yang sesuai pencarian" : "Belum ada stadion"}
            </div>
          ) : (
            <StadiumsTable stadiums={filteredStadiums} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>

      <StadiumFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stadium={selectedStadium}
        onSuccess={() => { fetchStadiums(); setDialogOpen(false); }}
      />
    </div>
  );
};

export default Stadiums;
