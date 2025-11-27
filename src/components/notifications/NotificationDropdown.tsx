import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAdminNotifications, Notification } from "@/hooks/useAdminNotifications";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, clearNotification, clearAll } = useAdminNotifications();

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case 'competition':
        navigate(`/competitions/${notification.data.id}`);
        break;
      case 'player_registration':
        navigate(`/competitions/${notification.data.competition_id}`);
        break;
      case 'role_request':
        navigate('/users');
        break;
      case 'player':
        navigate(`/players/${notification.data.id}`);
        break;
      case 'player_document':
        navigate(`/players/${notification.data.player_id}`);
        break;
      case 'transfer':
        navigate(`/transfers/${notification.data.id}`);
        break;
    }
    clearNotification(notification.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 min-w-[20px] px-1 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs"
              onClick={clearAll}
            >
              Tandai semua dibaca
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi baru
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer flex-col items-start p-4"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-sm">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { 
                      addSuffix: true,
                      locale: idLocale 
                    })}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground mt-1">
                  {notification.description}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
