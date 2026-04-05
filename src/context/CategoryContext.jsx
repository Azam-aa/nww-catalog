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
      const data = await getCategories();
      
      if (data.length === 0) {
        // Seed DB if it's completely empty
        // Strip out 'others' category during seeding
        const seedData = INITIAL_CATEGORIES.filter(c => c.id !== 'others');
        await seedCategories(seedData);
        const newData = await getCategories();
        setCategories(newData);
      } else {
        setCategories(data);
      }
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
