import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../hooks/useProducts';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { ProductCard } from '../components/catalog/ProductCard';
import { ImageViewer } from '../components/viewer/ImageViewer';
import { ChevronLeft } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export function ProductListPage() {
  const { cat, sub } = useParams();
  const { products, loadMore, hasMore, loading: productsLoading, error } = useProducts(cat, sub);
  const { categories, loading: categoriesLoading } = useCategories();
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const category = categories.find(c => c.id === cat);
  const subCategory = category?.subCategories?.find(s => s.id === sub);

  if (categoriesLoading) {
    return <div className="pt-[56px] min-h-screen flex justify-center items-center"><Spinner /></div>;
  }

  if (!category || !subCategory) {
    return <div className="pt-[56px]"><EmptyState message="Subcategory not found" /></div>;
  }

  return (
    <div className="pt-[56px] min-h-screen flex flex-col bg-surface-secondary dark:bg-dark-primary">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border bg-surface-primary dark:bg-dark-secondary sticky top-[56px] z-30">
        <div className="flex items-center space-x-1">
          <Link to={`/category/${cat}`} className="p-1 -ml-1 hover:bg-surface-secondary dark:hover:bg-dark-tertiary rounded-full transition-colors">
            <ChevronLeft size={24} className="text-ink-primary dark:text-white" />
          </Link>
          <h1 className="text-lg font-heading font-bold text-ink-primary dark:text-white">
            {subCategory.label}
          </h1>
        </div>
        <Badge>{products.length} items</Badge>
      </div>

      {error ? (
        <div className="p-4 text-red-500 text-center">{error}</div>
      ) : (
        <div className="flex-1">
          <ProductGrid isEmpty={products.length === 0 && !productsLoading}>
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={setSelectedProduct} 
              />
            ))}
          </ProductGrid>
          
          {/* Loading Indicator */}
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {productsLoading && <Spinner />}
          </div>
        </div>
      )}

      {/* Fullscreen Viewer Overlay */}
      {selectedProduct && (
        <ImageViewer 
          product={selectedProduct} 
          allProducts={products} 
          onClose={() => setSelectedProduct(null)} 
          onChangeProduct={setSelectedProduct} 
        />
      )}
    </div>
  );
}
