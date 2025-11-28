import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Trophy, BarChart3, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useUserRole } from "@/hooks/useUserRole";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdminFederasi } = useUserRole();
  const { unreadCount } = useAdminNotifications();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Calendar, label: "Matches", path: "/matches" },
    { icon: Trophy, label: "Standings", path: "/competitions" },
    { icon: BarChart3, label: "Stats", path: "/players" },
    { icon: Menu, label: "More", path: "/clubs" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative touch-manipulation min-h-[44px] min-w-[44px]",
                "transition-colors duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.label === "Home" && isAdminFederasi && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-2">
                    <NotificationBadge count={unreadCount} />
                  </div>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
