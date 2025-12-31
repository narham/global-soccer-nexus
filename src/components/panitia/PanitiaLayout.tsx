import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { PanitiaSidebar } from "./PanitiaSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

export const PanitiaLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { isPanitia, isAdminFederasi, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setLoading(false);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Wait for both auth and role to be checked
  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Check if user has panitia or admin_federasi role
  if (!isPanitia && !isAdminFederasi) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <h2 className="text-2xl font-bold text-destructive mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground mb-4">
            Anda tidak memiliki izin untuk mengakses halaman Panitia.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <PanitiaSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};
