import { Badge } from "@/components/ui/badge";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = "" }: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <Badge 
      variant="destructive" 
      className={`ml-auto h-5 min-w-[20px] px-1.5 text-xs font-semibold ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
