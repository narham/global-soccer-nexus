import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, Mail, Phone } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { StaffFormDialog } from "./StaffFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffTableProps {
  clubId: string;
  staff: any[];
  onRefresh: () => void;
}

export const StaffTable = ({ clubId, staff, onRefresh }: StaffTableProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("club_staff")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Staf berhasil dihapus");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      "Pelatih Kepala": "bg-blue-500",
      "Asisten Pelatih": "bg-cyan-500",
      "Pelatih Kiper": "bg-indigo-500",
      "Dokter Tim": "bg-green-500",
      "Fisioterapis": "bg-emerald-500",
      "Manajer Tim": "bg-purple-500",
    };
    return <Badge className={roleColors[role] || "bg-gray-500"}>{role}</Badge>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Staf Klub</h3>
        <Button onClick={() => { setSelectedStaff(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Staf
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Belum ada staf</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{getRoleBadge(person.role)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {person.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {person.email}
                        </div>
                      )}
                      {person.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {person.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {person.joined_date
                      ? new Date(person.joined_date).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      onEdit={() => { setSelectedStaff(person); setFormOpen(true); }}
                      onDelete={() => handleDelete(person.id)}
                      itemName={person.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clubId={clubId}
        staff={selectedStaff}
        onSuccess={onRefresh}
      />
    </div>
  );
};
