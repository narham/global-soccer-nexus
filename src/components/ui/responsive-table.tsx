import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Normal table with horizontal scroll */}
      <div className="hidden md:block overflow-x-auto">
        <div className="rounded-md border">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}

export function MobileCardList<T>({ items, renderCard, emptyMessage = "Tidak ada data" }: MobileCardListProps<T>) {
  return (
    <div className="md:hidden space-y-3">
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        items.map((item, index) => renderCard(item, index))
      )}
    </div>
  );
}

interface CollapsibleRowProps {
  children: ReactNode;
  details?: ReactNode;
  className?: string;
}

export function CollapsibleRow({ children, details, className }: CollapsibleRowProps) {
  return (
    <div className={cn("touch-manipulation", className)}>
      {children}
      {details && (
        <div className="mt-2 pt-2 border-t border-border text-sm">
          {details}
        </div>
      )}
    </div>
  );
}
