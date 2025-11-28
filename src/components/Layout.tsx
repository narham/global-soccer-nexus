import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Session } from "@supabase/supabase-js";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { useUserRole } from "@/hooks/useUserRole";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdminFederasi } = useUserRole();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <SidebarProvider>
      <CommandPalette />
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 shadow-sm">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gradient-primary">
                Sistem Manajemen Sepakbola Indonesia
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
              {isAdminFederasi && <NotificationDropdown />}
            </div>
          </header>
          <main className="flex-1 p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}