import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, User } from "lucide-react";

interface ProfilePhotoTabProps {
  userId: string;
}

export const ProfilePhotoTab = ({ userId }: ProfilePhotoTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId)
          .single();

        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        }
      } catch (error: any) {
        console.error("Error fetching avatar:", error);
      }
    };

    if (userId) {
      fetchAvatar();
    }
  }, [userId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Tipe file tidak valid",
          description: "Hanya file gambar yang diperbolehkan",
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File terlalu besar",
          description: "Ukuran maksimal file adalah 2MB",
        });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({
        title: "Berhasil",
        description: "Foto profil berhasil diperbarui",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal upload foto",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-6">
        <Avatar className="h-32 w-32">
          <AvatarImage src={avatarUrl} alt="Profile" />
          <AvatarFallback>
            <User className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>

        <div className="text-center space-y-2">
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{uploading ? "Mengupload..." : "Upload Foto"}</span>
            </div>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </Label>
          <p className="text-sm text-muted-foreground">
            Format: JPG, PNG. Maksimal 2MB
          </p>
        </div>
      </div>
    </div>
  );
};
