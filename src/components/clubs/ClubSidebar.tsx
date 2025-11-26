import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Info,
  Users,
  UserCog,
  Calendar,
  FileText,
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
            {collapsed ? "🏆" : "Manajemen Klub"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)}>
                    <NavLink to={item.url} end={item.exact}>
                      <item.icon className={collapsed ? "mx-auto" : ""} />
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
