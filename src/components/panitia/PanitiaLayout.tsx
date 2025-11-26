import { Outlet } from "react-router-dom";
import { PanitiaSidebar } from "./PanitiaSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export const PanitiaLayout = () => {
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
