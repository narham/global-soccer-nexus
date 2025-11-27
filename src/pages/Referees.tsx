import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RefereesTable } from "@/components/referees/RefereesTable";
import { RefereeFormDialog } from "@/components/referees/RefereeFormDialog";
import { useUserRole } from "@/hooks/useUserRole";

const Referees = () => {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReferee, setEditingReferee] = useState<any>(null);
  const { toast } = useToast();
  const { isAdminFederasi } = useUserRole();

  useEffect(() => {
    fetchReferees();
  }, []);

  const fetchReferees = async () => {
    try {
      const { data, error } = await supabase
        .from("referees")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setReferees(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memuat data wasit",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (referee: any) => {
    setEditingReferee(referee);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus wasit ini?")) return;

    try {
      const { error } = await supabase.from("referees").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Wasit dihapus",
        description: "Data wasit berhasil dihapus",
      });

      fetchReferees();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus wasit",
        description: error.message,
      });
    }
  };

  const handleDialogClose = (saved: boolean) => {
    setDialogOpen(false);
    setEditingReferee(null);
    if (saved) fetchReferees();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wasit</h1>
          <p className="text-muted-foreground">
            Kelola data wasit dan penugasan pertandingan
          </p>
        </div>
        {isAdminFederasi && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Wasit
          </Button>
        )}
      </div>

      <RefereesTable
        referees={referees}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RefereeFormDialog
        open={dialogOpen}
        referee={editingReferee}
        onClose={handleDialogClose}
      />
    </div>
  );
};

export default Referees;
