import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFirst: () => void;
  onLast: () => void;
  from: number;
  pageSize: number;
}

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onFirst,
  onLast,
  from,
  pageSize,
}: PaginationControlsProps) {
  if (totalCount <= pageSize) return null;

  const showingFrom = from + 1;
  const showingTo = Math.min(from + pageSize, totalCount);

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Menampilkan {showingFrom}–{showingTo} dari {totalCount}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onFirst} disabled={!hasPrev}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPrev} disabled={!hasPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 text-sm font-medium">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNext} disabled={!hasNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onLast} disabled={!hasNext}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
