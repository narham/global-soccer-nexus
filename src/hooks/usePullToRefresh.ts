import { useEffect, useRef, useState } from "react";

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStart = useRef<number>(0);
  const scrollY = useRef<number>(0);

  const handleTouchStart = (e: TouchEvent) => {
    scrollY.current = window.scrollY;
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (scrollY.current > 0) return; // Only trigger at top of page
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStart.current;
    
    if (distance > 0) {
      setPullDistance(distance / resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return {
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
