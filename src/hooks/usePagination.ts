import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  from: number;
  to: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setTotalCount: (count: number) => void;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  resetPage: () => void;
}

export function usePagination({ pageSize = 25, initialPage = 1 }: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    from,
    to,
    setPage,
    nextPage,
    prevPage,
    setTotalCount,
    totalCount,
    totalPages,
    hasNext,
    hasPrev,
    resetPage,
  };
}
