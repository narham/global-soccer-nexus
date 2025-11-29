import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Info,
  Users,
  UserCog,
  Calendar,
  FileText,
  Target,
  Home,
  Shield,
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
  useSidebar,
} from "@/components/ui/sidebar";

interface ClubSidebarProps {
  clubId: string;
}

export function ClubSidebar({ clubId }: ClubSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const menuItems = [
    { title: "Dashboard", url: `/clubs/${clubId}`, icon: LayoutDashboard, exact: true },
    { title: "Info Umum", url: `/clubs/${clubId}/info`, icon: Info },
    { title: "Pemain", url: `/clubs/${clubId}/players`, icon: Users },
    { title: "Staf", url: `/clubs/${clubId}/staff`, icon: UserCog },
    { title: "Kompetisi", url: `/clubs/${clubId}/competitions`, icon: Target },
    { title: "Pertandingan", url: `/clubs/${clubId}/matches`, icon: Calendar },
    { title: "Dokumen", url: `/clubs/${clubId}/documents`, icon: FileText },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center px-0" : ""}>
            {collapsed ? "🏠" : "Navigasi"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/"}>
                  <NavLink to="/" className="flex items-center gap-2">
                    <Home className={collapsed ? "mx-auto h-4 w-4" : "h-4 w-4"} />
                    {!collapsed && <span>Dashboard Utama</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/clubs"}>
                  <NavLink to="/clubs" className="flex items-center gap-2">
                    <Shield className={collapsed ? "mx-auto h-4 w-4" : "h-4 w-4"} />
                    {!collapsed && <span>Daftar Klub</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-2 border-t" />

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center px-0" : ""}>
            {collapsed ? "🏆" : "Manajemen Klub"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)}>
                    <NavLink to={item.url} end={item.exact} className="flex items-center gap-2">
                      <item.icon className={collapsed ? "mx-auto h-4 w-4" : "h-4 w-4"} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
