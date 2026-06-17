'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronLeft, HelpCircle } from 'lucide-react';
import { getAllProducts } from '../../lib/db';
import { ProductCard } from '../../components/catalog/ProductCard';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ImageViewer = dynamic(() => import('../../components/viewer/ImageViewer').then(mod => mod.ImageViewer), { ssr: false });

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch all products on mount to perform fast client-side searching
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await getAllProducts();
        setAllProducts(data);
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Simple clean search filtering logic
  const filteredProducts = useMemo(() => {
    const s = query.toLowerCase().trim();
    if (!s) return [];

    return allProducts.filter(p => {
      const title = (p.title || '').toLowerCase();
      const material = (p.material || '').toLowerCase();
      const color = (p.color || '').toLowerCase();
      const description = (p.description || '').toLowerCase();

      return (
        title.includes(s) ||
        material.includes(s) ||
        color.includes(s) ||
        description.includes(s) ||
        p.category_id.toLowerCase().includes(s)
      );
    });
  }, [query, allProducts]);

  return (
    <div className="min-h-screen bg-surface-secondary dark:bg-dark-primary flex flex-col">
      {/* Search Header */}
      <div className="sticky top-[56px] z-30 bg-surface-primary dark:bg-dark-secondary border-b border-surface-border dark:border-dark-border px-4 py-3">
        <div className="relative flex items-center gap-3">
          <button 
            onClick={() => router.back()}
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
              className="w-full bg-surface-secondary dark:bg-dark-tertiary border-none rounded-xl pl-10 pr-10 py-2.5 text-ink-primary dark:text-white focus:ring-2 focus:ring-brand-500 transition-all text-sm outline-none"
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

      {/* Results area */}
      <div className="flex-1 p-3">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="text-brand-500 animate-spin" size={32} />
          </div>
        ) : !query.trim() ? (
          <div className="p-8 flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 bg-surface-tertiary dark:bg-dark-tertiary rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-ink-muted dark:text-gray-500" />
            </div>
            <h2 className="text-lg font-heading font-extrabold text-ink-primary dark:text-white mb-2">
              Search Catalog
            </h2>
            <p className="text-xs text-ink-secondary dark:text-gray-400 max-w-xs leading-relaxed">
              Find furniture items by name, material, color, or category description. e.g. "Almari", "Grey", or "Bed".
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="pb-10">
            <div className="px-1 py-2 mb-2">
              <p className="text-xs font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Found {filteredProducts.length} designs
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={setSelectedProduct} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-4">
              <X size={32} className="text-red-500" />
            </div>
            <h2 className="text-lg font-heading font-extrabold text-ink-primary dark:text-white mb-2">
              No results found
            </h2>
            <p className="text-xs text-ink-secondary dark:text-gray-400">
              We couldn't find any designs matching "{query}".
            </p>
          </div>
        )}
      </div>

      {/* Details Viewer Overlay */}
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
