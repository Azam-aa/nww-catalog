import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback, hasMore) {
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting) {
            callback(); 
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
        observerRef.current.observe(sentinelRef.current);
    }
    
    return () => observerRef.current?.disconnect();
  }, [callback, hasMore]);

  return sentinelRef;
}
