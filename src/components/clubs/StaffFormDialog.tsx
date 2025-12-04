import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  staff?: any;
  onSuccess: () => void;
}

export const StaffFormDialog = ({ open, onOpenChange, clubId, staff, onSuccess }: StaffFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: staff?.name || "",
    role: staff?.role || "",
    email: staff?.email || "",
    phone: staff?.phone || "",
    joined_date: staff?.joined_date || "",
  });

  const roles = [
    "Pelatih Kepala",
    "Asisten Pelatih",
    "Pelatih Kiper",
    "Dokter Tim",
    "Fisioterapis",
    "Manajer Tim",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData, club_id: clubId };

      if (staff) {
        const { error } = await supabase
          .from("club_staff")
          .update(payload)
          .eq("id", staff.id);

        if (error) throw error;
        toast.success("Staf berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("club_staff")
          .insert([payload]);

        if (error) throw error;
        toast.success("Staf berhasil ditambahkan");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staf" : "Tambah Staf Baru"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Kelola data staf klub untuk menambahkan ke daftar tim manajemen
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Jabatan *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joined_date">Tanggal Bergabung</Label>
              <Input
                id="joined_date"
                type="date"
                value={formData.joined_date}
                onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : staff ? "Update" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
