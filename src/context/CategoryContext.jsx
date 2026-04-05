import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCategories, seedCategories } from '../firebase/categories';
import { CATEGORIES as INITIAL_CATEGORIES } from '../data/categories';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // 🚨 FORCE DB WIPE & RESEED (For Subagent)
      const existing = await getCategories();
      for (const cat of existing) {
        await deleteCategory(cat.id);
      }
      await seedCategories(INITIAL_CATEGORIES);
      // 🚨 END FORCE
      
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message);
      // Fallback to static if network fails
      setCategories(INITIAL_CATEGORIES); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider value={{ categories, loading, error, refreshCategories: fetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategories = () => useContext(CategoryContext);
