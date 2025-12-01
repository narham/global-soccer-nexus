import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ProfileSecurityTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password tidak cocok",
        description: "Pastikan password baru dan konfirmasi password sama",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password terlalu pendek",
        description: "Password minimal 6 karakter",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
      });

      // Reset form
      setPasswords({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengubah password",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_password">Password Baru</Label>
          <Input
            id="new_password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
            placeholder="Masukkan password baru"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password">Konfirmasi Password</Label>
          <Input
            id="confirm_password"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, confirmPassword: e.target.value })
            }
            placeholder="Konfirmasi password baru"
            minLength={6}
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Ubah Password
      </Button>
    </form>
  );
};
