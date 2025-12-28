import { useState, useRef } from "react";
import { Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PlayerPhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  playerName?: string;
}

export const PlayerPhotoUpload = ({ value, onChange, playerName }: PlayerPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Format tidak valid",
        description: "Hanya file gambar yang diperbolehkan (JPG, PNG, WEBP)",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Ukuran terlalu besar",
        description: "Ukuran foto maksimal 5MB",
      });
      return;
    }

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `player-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `players/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({
        title: "Foto berhasil diupload",
        description: "Foto pemain telah disimpan",
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    onChange("");
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24 border-2 border-border">
          <AvatarImage src={value} alt={playerName} />
          <AvatarFallback className="bg-muted text-lg">
            {playerName ? getInitials(playerName) : <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {value ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Foto telah diupload</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClick}
                  disabled={uploading}
                >
                  {uploading ? "Mengupload..." : "Ganti Foto"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Hapus
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                uploading && "opacity-50 pointer-events-none"
              )}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {uploading ? "Mengupload..." : "Upload Foto Pemain"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WEBP (Maks. 5MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
