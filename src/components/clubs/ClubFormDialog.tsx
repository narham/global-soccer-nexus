import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface ClubFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club?: any;
  onSuccess: () => void;
}

export const ClubFormDialog = ({ open, onOpenChange, club, onSuccess }: ClubFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { isAdminKlub } = useUserRole();
  const [formData, setFormData] = useState({
    name: club?.name || "",
    short_name: club?.short_name || "",
    city: club?.city || "",
    address: club?.address || "",
    stadium_name: club?.stadium_name || "",
    founded_year: club?.founded_year || "",
    home_color: club?.home_color || "",
    away_color: club?.away_color || "",
    license_status: club?.license_status || "pending",
    license_valid_until: club?.license_valid_until || "",
    logo_url: club?.logo_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (club) {
        // Admin Klub shouldn't update license fields
        const updateData = isAdminKlub 
          ? {
              name: formData.name,
              short_name: formData.short_name,
              city: formData.city,
              address: formData.address,
              stadium_name: formData.stadium_name,
              founded_year: formData.founded_year,
              home_color: formData.home_color,
              away_color: formData.away_color,
              logo_url: formData.logo_url,
            }
          : formData;

        const { error } = await supabase
          .from("clubs")
          .update(updateData)
          .eq("id", club.id);

        if (error) throw error;
        toast.success("Klub berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("clubs")
          .insert([formData]);

        if (error) throw error;
        toast.success("Klub berhasil ditambahkan");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{club ? "Edit Klub" : "Tambah Klub Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Klub *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short_name">Nama Pendek</Label>
                <Input
                  id="short_name"
                  value={formData.short_name}
                  onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded_year">Tahun Berdiri</Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stadium_name">Nama Stadion</Label>
              <Input
                id="stadium_name"
                value={formData.stadium_name}
                onChange={(e) => setFormData({ ...formData, stadium_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="home_color">Warna Home</Label>
                <Input
                  id="home_color"
                  value={formData.home_color}
                  onChange={(e) => setFormData({ ...formData, home_color: e.target.value })}
                  placeholder="Biru"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away_color">Warna Away</Label>
                <Input
                  id="away_color"
                  value={formData.away_color}
                  onChange={(e) => setFormData({ ...formData, away_color: e.target.value })}
                  placeholder="Putih"
                />
              </div>
            </div>

            {!isAdminKlub && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_status">Status Lisensi</Label>
                  <Select
                    value={formData.license_status}
                    onValueChange={(value) => setFormData({ ...formData, license_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_valid_until">Lisensi Valid Hingga</Label>
                  <Input
                    id="license_valid_until"
                    type="date"
                    value={formData.license_valid_until}
                    onChange={(e) => setFormData({ ...formData, license_valid_until: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : club ? "Update" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
