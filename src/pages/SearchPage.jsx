import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ArrowRight, History } from 'lucide-react';
import { getAllProducts } from '../firebase/products';
import { useCategories } from '../context/CategoryContext';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { ProductCard } from '../components/catalog/ProductCard';
import { ImageViewer } from '../components/viewer/ImageViewer';
import { Spinner } from '../components/ui/Spinner';

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { categories } = useCategories();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await getAllProducts();
        setAllProducts(data);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Search Logic
  const filteredProducts = useMemo(() => {
    const s = query.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!s) return [];
    
    return allProducts.filter(p => {
      // Create a big searchable string from various fields
      const category = categories.find(c => c.id === p.category);
      const subCategory = category?.subCategories?.find(sc => sc.id === p.subCategory);
      
      const searchableText = [
        p.name,
        category?.label,
        subCategory?.label,
        p.material,
        p.color,
        p.description,
        p.typeCode,
        p.size
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      const normalizedSearchable = searchableText.replace(/\s+/g, ' ');
      const ultraNormalizedSearchable = searchableText.replace(/[^a-z0-9]/g, '');
      const ultraNormalizedQuery = s.replace(/[^a-z0-9]/g, '');

      return (
        normalizedSearchable.includes(s) ||
        ultraNormalizedSearchable.includes(ultraNormalizedQuery)
      );
    });
  }, [query, allProducts, categories]);

  if (loading) {
    return (
      <div className="pt-[56px] min-h-screen flex items-center justify-center bg-surface-primary dark:bg-dark-primary">
        <Spinner />
      </div>
    );
  }

  const totalLoaded = allProducts.length;

  return (
    <div className="pt-[56px] min-h-screen bg-surface-secondary dark:bg-dark-primary flex flex-col">
      {/* Search Header */}
      <div className="sticky top-[56px] z-30 bg-surface-primary dark:bg-dark-secondary border-b border-surface-border dark:border-dark-border px-4 py-3">
        <div className="relative flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-ink-secondary dark:text-gray-400 hover:text-ink-primary dark:hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="relative flex-1">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-gray-500" 
            />
            <input 
              autoFocus
              type="text"
              placeholder="Search products, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface-secondary dark:bg-dark-tertiary border-none rounded-xl pl-10 pr-10 py-2.5 text-ink-primary dark:text-white focus:ring-2 focus:ring-brand-500 transition-all text-sm"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary dark:text-gray-500 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results / Empty State */}
      <div className="flex-1">
        {!query.trim() ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-tertiary dark:bg-dark-tertiary rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-ink-muted dark:text-gray-500" />
            </div>
            <h2 className="text-lg font-heading font-bold text-ink-primary dark:text-white mb-2">
              Search the Catalog
            </h2>
            <p className="text-sm text-ink-secondary dark:text-gray-400 max-w-xs">
              Find products by name, type, material, or category. Try searching for "Bed" or "Iron".
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="pb-10">
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-wider">
                Showing {filteredProducts.length} results
              </p>
            </div>
            <ProductGrid isEmpty={false}>
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={setSelectedProduct} 
                />
              ))}
            </ProductGrid>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <h2 className="text-lg font-heading font-bold text-ink-primary dark:text-white mb-2">
              No results found
            </h2>
            <p className="text-sm text-ink-secondary dark:text-gray-400">
              We couldn't find anything matching "{query}".
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Viewer Overlay */}
      {selectedProduct && (
        <ImageViewer 
          product={selectedProduct} 
          allProducts={filteredProducts} 
          onClose={() => setSelectedProduct(null)} 
          onChangeProduct={setSelectedProduct} 
        />
      )}
    </div>
  );
}
