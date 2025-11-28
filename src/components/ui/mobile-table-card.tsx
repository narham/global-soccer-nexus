import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MobileTableCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileTableCard({ children, className, onClick }: MobileTableCardProps) {
  return (
    <Card 
      className={cn(
        "touch-manipulation transition-colors",
        onClick && "cursor-pointer hover:bg-accent/50 active:bg-accent",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}

interface MobileTableRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileTableRow({ label, value, className }: MobileTableRowProps) {
  return (
    <div className={cn("flex justify-between items-center py-2 border-b last:border-0 min-h-[44px]", className)}>
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className="text-sm font-medium text-right">{value}</div>
    </div>
  );
}
