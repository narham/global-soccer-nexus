import { useEffect, useState } from "react";
import { useParams, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClubHeader } from "./ClubHeader";
import { ClubSidebar } from "./ClubSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const ClubLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<any>(null);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clubs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setClub(data);
      } catch (error: any) {
        toast.error(error.message);
        navigate("/clubs");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClub();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-muted-foreground">Klub tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/clubs")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Klub
          </Button>
          <ClubHeader club={club} />
        </div>
      </div>

      <SidebarProvider>
        <div className="flex flex-1 w-full">
          <ClubSidebar clubId={club.id} />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              <Outlet context={{ club }} />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};
