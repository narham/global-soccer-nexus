import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Shield,
  Calendar,
  Building2,
  ArrowRightLeft,
  LogOut,
  UserCog,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Klub", url: "/clubs", icon: Shield },
  { title: "Pemain", url: "/players", icon: Users },
  { title: "Kompetisi", url: "/competitions", icon: Trophy },
  { title: "Pertandingan", url: "/matches", icon: Calendar },
  { title: "Transfer", url: "/transfers", icon: ArrowRightLeft },
  { title: "Stadion", url: "/stadiums", icon: Building2 },
];

const adminMenuItems = [
  { title: "Pengguna", url: "/users", icon: UserCog },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { role, isAdminFederasi, isAdminKlub, isPanitia, isWasit } = useUserRole();

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Berhasil keluar",
        description: "Sampai jumpa lagi!",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal keluar",
        description: error.message,
      });
    }
  };

  // Filter menu based on role
  const getFilteredMenuItems = () => {
    if (!role) return [{ title: "Dashboard", url: "/", icon: LayoutDashboard }];
    
    if (isAdminFederasi) return menuItems; // Admin federasi sees all
    
    if (isAdminKlub) {
      // Admin klub can see: dashboard, clubs, players, transfers
      return menuItems.filter(item => 
        ["/", "/clubs", "/players", "/transfers"].includes(item.url)
      );
    }
    
    if (isPanitia) {
      // Panitia can see: dashboard, competitions, matches, stadiums
      return menuItems.filter(item => 
        ["/", "/competitions", "/matches", "/stadiums"].includes(item.url)
      );
    }
    
    if (isWasit) {
      // Wasit can see: dashboard, matches
      return menuItems.filter(item => 
        ["/", "/matches"].includes(item.url)
      );
    }
    
    return [{ title: "Dashboard", url: "/", icon: LayoutDashboard }];
  };

  const filteredMenuItems = getFilteredMenuItems();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center px-0" : ""}>
            {collapsed ? "⚽" : "Menu Utama"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className={collapsed ? "mx-auto" : ""} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isAdminFederasi && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "text-center px-0" : ""}>
              {collapsed ? "⚙️" : "Administrasi"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end>
                        <item.icon className={collapsed ? "mx-auto" : ""} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start ${collapsed ? "px-2" : ""}`}
        >
          <LogOut className={collapsed ? "mx-auto" : "mr-2"} />
          {!collapsed && "Keluar"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}