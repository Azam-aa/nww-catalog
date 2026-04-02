import { useState, useCallback } from 'react';
import { getProducts } from '../firebase/products';

export function useProducts(category, subCategory) {
  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const result = await getProducts({ category, subCategory, lastDoc });
      setProducts(prev => {
        // Simple deduplication logic
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = result.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, subCategory, lastDoc, loading, hasMore]);

  return { products, loadMore, hasMore, loading, error };
}
