import { LayoutDashboard, Trophy, Calendar, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/panitia", icon: LayoutDashboard },
  { title: "Kompetisi", url: "/panitia/competitions", icon: Trophy },
  { title: "Pertandingan", url: "/panitia/matches", icon: Calendar },
];

export function PanitiaSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isActive = (path: string) => {
    if (path === "/panitia") return currentPath === path;
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Panitia</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/panitia"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
