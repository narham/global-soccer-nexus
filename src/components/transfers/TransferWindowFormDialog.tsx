import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransferWindowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingWindow?: any;
}

export function TransferWindowFormDialog({ open, onOpenChange, onSuccess, editingWindow }: TransferWindowFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    window_type: "regular",
    start_date: "",
    end_date: "",
    is_active: false,
  });

  useEffect(() => {
    if (editingWindow) {
      setFormData({
        name: editingWindow.name,
        window_type: editingWindow.window_type,
        start_date: editingWindow.start_date,
        end_date: editingWindow.end_date,
        is_active: editingWindow.is_active || false,
      });
    } else {
      setFormData({
        name: "",
        window_type: "regular",
        start_date: "",
        end_date: "",
        is_active: false,
      });
    }
  }, [editingWindow, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If setting as active, deactivate all other windows first
      if (formData.is_active) {
        await supabase
          .from("transfer_windows")
          .update({ is_active: false })
          .neq("id", editingWindow?.id || "");
      }

      if (editingWindow) {
        const { error } = await supabase
          .from("transfer_windows")
          .update(formData)
          .eq("id", editingWindow.id);

        if (error) throw error;
        toast.success("Transfer window berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("transfer_windows")
          .insert([formData]);

        if (error) throw error;
        toast.success("Transfer window berhasil dibuat");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingWindow ? "Edit Transfer Window" : "Buat Transfer Window Baru"}</DialogTitle>
          <DialogDescription>
            {editingWindow ? "Perbarui informasi transfer window" : "Isi form untuk membuat transfer window baru"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Transfer Window</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Transfer Window Musim 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="window_type">Tipe Window</Label>
            <Select
              value={formData.window_type}
              onValueChange={(value) => setFormData({ ...formData, window_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Transfer</SelectItem>
                <SelectItem value="mid_season">Mid Season Transfer</SelectItem>
                <SelectItem value="special">Special Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Berakhir</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Aktifkan Transfer Window</Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingWindow ? "Perbarui" : "Buat"} Window
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
