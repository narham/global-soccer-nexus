import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, FileText, Shield, Camera } from "lucide-react";
import { ProfileInfoTab } from "@/components/profile/ProfileInfoTab";
import { ProfilePhotoTab } from "@/components/profile/ProfilePhotoTab";
import { ProfileSecurityTab } from "@/components/profile/ProfileSecurityTab";
import { ProfileDocumentsTab } from "@/components/profile/ProfileDocumentsTab";
import { ProfileRoleStatusTab } from "@/components/profile/ProfileRoleStatusTab";
import { useToast } from "@/hooks/use-toast";

const ProfileDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profil Saya</h1>
        <p className="text-muted-foreground mt-2">
          Kelola informasi profil dan pengaturan akun Anda
        </p>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Foto</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Keamanan</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Dokumen</span>
            </TabsTrigger>
            <TabsTrigger value="role" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Role</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <ProfileInfoTab userId={userId} />
          </TabsContent>

          <TabsContent value="photo">
            <ProfilePhotoTab userId={userId} />
          </TabsContent>

          <TabsContent value="security">
            <ProfileSecurityTab />
          </TabsContent>

          <TabsContent value="documents">
            <ProfileDocumentsTab userId={userId} />
          </TabsContent>

          <TabsContent value="role">
            <ProfileRoleStatusTab userId={userId} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProfileDashboard;
