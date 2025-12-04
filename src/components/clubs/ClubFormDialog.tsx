import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ClubFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club?: any;
  onSuccess: () => void;
}

export const ClubFormDialog = ({ open, onOpenChange, club, onSuccess }: ClubFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { isAdminKlub } = useUserRole();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(club?.logo_url || "");
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
    email: club?.email || "",
    phone: club?.phone || "",
    website: club?.website || "",
    social_media: club?.social_media || "",
    description: club?.description || "",
  });

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setFormData({ ...formData, logo_url: "" });
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return formData.logo_url || null;

    setUploading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('club-logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast.error(`Upload logo gagal: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload logo if new file selected
      const logoUrl = await uploadLogo();
      if (logoFile && !logoUrl) {
        setLoading(false);
        return;
      }

      const dataToSave = { ...formData };
      if (logoUrl) {
        dataToSave.logo_url = logoUrl;
      }

      if (club) {
        // Admin Klub shouldn't update license fields
        const updateData = isAdminKlub 
          ? {
              name: dataToSave.name,
              short_name: dataToSave.short_name,
              city: dataToSave.city,
              address: dataToSave.address,
              stadium_name: dataToSave.stadium_name,
              founded_year: dataToSave.founded_year,
              home_color: dataToSave.home_color,
              away_color: dataToSave.away_color,
              logo_url: dataToSave.logo_url,
              email: dataToSave.email,
              phone: dataToSave.phone,
              website: dataToSave.website,
              social_media: dataToSave.social_media,
              description: dataToSave.description,
            }
          : dataToSave;

        const { error } = await supabase
          .from("clubs")
          .update(updateData)
          .eq("id", club.id);

        if (error) throw error;
        toast.success("Klub berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("clubs")
          .insert([dataToSave]);

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
          <p className="text-sm text-muted-foreground">
            Kelola informasi dan identitas klub sepakbola
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo Klub</Label>
              <div className="flex items-start gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-24 h-24 object-contain rounded-lg border border-border bg-background"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logoPreview ? 'Ganti Logo' : 'Upload Logo'}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG, WEBP. Maksimal 2MB
                  </p>
                </div>
              </div>
            </div>

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
                      <SelectItem value="approved">Aktif</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@club.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 21 1234 5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://club.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_media">Social Media</Label>
                <Input
                  id="social_media"
                  value={formData.social_media}
                  onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                  placeholder="@clubofficial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat tentang klub..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {uploading ? "Uploading logo..." : loading ? "Menyimpan..." : club ? "Update" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
