'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAdmin } from '../../context/AdminContext';
import { ProductCard } from './ProductCard';
import { ChevronLeft, Upload, Loader2, HelpCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';

// Lazy load heavy image viewer component
const ImageViewer = dynamic(() => import('../viewer/ImageViewer').then(mod => mod.ImageViewer), { ssr: false });

const SkeletonCard = () => (
  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-surface-tertiary dark:bg-dark-tertiary animate-pulse border border-surface-border dark:border-dark-border">
    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse" />
      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
    </div>
  </div>
);

export function CategoryView({ category, subcategories, initialProducts }) {
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef(null);

  // Local state for products so updates are immediate
  const [products, setProducts] = useState(initialProducts);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Pagination & Loading States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProducts.length === 50);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({ all: 0, uncategorized: 0 });

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
    message: '',
  });

  // Fetch total product counts per subcategory on mount
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('subcategory_id')
          .eq('category_id', category.id);
        if (error) throw error;

        const countsMap = {};
        let allCount = 0;
        let uncategorizedCount = 0;

        (data || []).forEach(p => {
          allCount++;
          if (p.subcategory_id === null) {
            uncategorizedCount++;
          } else {
            countsMap[p.subcategory_id] = (countsMap[p.subcategory_id] || 0) + 1;
          }
        });

        setCounts({
          all: allCount,
          uncategorized: uncategorizedCount,
          ...countsMap
        });
      } catch (err) {
        console.error('Error fetching product counts:', err);
      }
    };
    fetchCounts();
  }, [category.id, products]);

  // Local filter applied on top of loaded products to reflect instant updates
  const filteredProducts = products.filter(product => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'uncategorized') return product.subcategory_id === null;
    return product.subcategory_id === activeFilter;
  });

  // Fetch next paginated chunk from DB
  const fetchProductsForFilter = async (filterId, pageNum = 0, append = false) => {
    if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const limit = 50;
      const offset = pageNum * limit;

      let query = supabase
        .from('products')
        .select('id, category_id, subcategory_id, image_url, title, material, color, size, description, price, cost_price, display_order, status, created_at')
        .eq('category_id', category.id);

      if (filterId === 'uncategorized') {
        query = query.is('subcategory_id', null);
      } else if (filterId !== 'all') {
        query = query.eq('subcategory_id', filterId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (data) {
        setProducts(prev => {
          if (append) {
            const existingIds = new Set(prev.map(p => p.id));
            const newProducts = data.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProducts];
          } else {
            return data;
          }
        });
        setHasMore(data.length === limit);
        setPage(pageNum + 1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setProducts([]);
    setPage(0);
    setHasMore(true);
    fetchProductsForFilter(filterId, 0, false);
  };

  // Handle local state updates after assigning subcategory inside details view
  const handleAssignProduct = (productId, newSubcategoryId) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            subcategory_id: newSubcategoryId,
            status: newSubcategoryId ? 'categorized' : 'uncategorized',
          };
        }
        return p;
      })
    );

    // Update selected product state so changes propagate immediately inside modal
    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(prev => ({
        ...prev,
        subcategory_id: newSubcategoryId,
        status: newSubcategoryId ? 'categorized' : 'uncategorized',
      }));
    }
  };

  // Concurrent Batch Uploader (10 uploads at a time using Promise.allSettled)
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadProgress({
      active: true,
      current: 0,
      total: files.length,
      message: 'Initializing compression...',
    });

    const uploadedProducts = [];
    const failedFiles = [];
    const CONCURRENCY_LIMIT = 10;

    const uploadSingleFile = async (file, index) => {
      try {
        // 1. Compress Image client-side
        let compressedFile = file;
        try {
          const options = {
            maxSizeMB: 0.3, // under 300KB
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          };
          compressedFile = await imageCompression(file, options);
        } catch (err) {
          console.warn('Image compression failed, using original file:', err);
        }

        // 2. Upload to server
        const formData = new FormData();
        formData.append('file', compressedFile);
        formData.append('categoryId', category.id);
        formData.append('title', file.name.split('.')[0] || 'Uncategorized Design');

        setUploadProgress(prev => ({
          ...prev,
          message: `Uploading: ${file.name}...`,
        }));

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }

        const responseData = await res.json();
        if (responseData.product) {
          uploadedProducts.push(responseData.product);
        }

        setUploadProgress(prev => ({
          ...prev,
          current: prev.current + 1,
        }));
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        failedFiles.push({ name: file.name, error: err.message });
      }
    };

    try {
      // Run uploads in concurrent batches of 10
      for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
        const batch = files.slice(i, i + CONCURRENCY_LIMIT);
        const promises = batch.map((file, idx) => uploadSingleFile(file, i + idx));
        await Promise.allSettled(promises);
      }

      // Prepend all successfully uploaded images
      setProducts(prev => [...uploadedProducts, ...prev]);
      
      if (failedFiles.length > 0) {
        alert(`Upload completed. Success: ${uploadedProducts.length}, Failed: ${failedFiles.length}\nErrors:\n${failedFiles.map(f => `${f.name}: ${f.error}`).join('\n')}`);
      } else {
        alert(`Success! Successfully uploaded ${uploadedProducts.length} images.`);
      }
    } catch (err) {
      console.error(err);
      alert('Upload process encountered an error: ' + err.message);
    } finally {
      setUploadProgress({
        active: false,
        current: 0,
        total: 0,
        message: '',
      });
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary dark:bg-dark-primary">
      {/* Category Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border bg-surface-primary dark:bg-dark-secondary sticky top-[56px] z-30">
        <div className="flex items-center space-x-1">
          <Link href="/" className="p-2 -ml-2 hover:bg-surface-secondary dark:hover:bg-dark-tertiary rounded-full transition-colors">
            <ChevronLeft size={24} className="text-ink-primary dark:text-white" />
          </Link>
          <h1 className="text-xl font-heading font-extrabold text-ink-primary dark:text-white pb-0.5">
            {category.name}
          </h1>
        </div>

        {/* Bulk Upload Button for Admins */}
        {isAdmin && (
          <div>
            <button
              onClick={triggerFileInput}
              disabled={uploadProgress.active}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-brand-500/10"
            >
              <Upload size={14} />
              Upload Images
            </button>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Subcategory Filter Bar */}
      <div className="bg-surface-primary dark:bg-dark-secondary border-b border-surface-border dark:border-dark-border sticky top-[108px] z-25">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar scroll-smooth">
          {/* ALL Filter */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              activeFilter === 'all'
                ? 'bg-ink-primary dark:bg-brand-500 text-white shadow-md'
                : 'bg-surface-secondary dark:bg-dark-tertiary text-ink-secondary dark:text-gray-400 border border-surface-border dark:border-dark-border'
            }`}
          >
            All ({counts.all || 0})
          </button>



          {/* Subcategory List Filters */}
          {subcategories.map(sub => {
            const subCount = counts[sub.id] || 0;
            return (
              <button
                key={sub.id}
                onClick={() => handleFilterChange(sub.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  activeFilter === sub.id
                    ? 'bg-ink-primary dark:bg-brand-500 text-white shadow-md'
                    : 'bg-surface-secondary dark:bg-dark-tertiary text-ink-secondary dark:text-gray-400 border border-surface-border dark:border-dark-border'
                }`}
              >
                {sub.name} ({subCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Progress Indicator Overlay */}
      {uploadProgress.active && (
        <div className="bg-brand-50 dark:bg-brand-950/10 border-b border-brand-100 dark:border-brand-900/30 px-4 py-3 flex items-center gap-3">
          <Loader2 size={16} className="text-brand-600 dark:text-brand-400 animate-spin shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-brand-700 dark:text-brand-400">
              {uploadProgress.message}
            </p>
            {/* Progress bar */}
            <div className="w-full bg-brand-100 dark:bg-brand-900/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400 shrink-0">
            {uploadProgress.current}/{uploadProgress.total}
          </span>
        </div>
      )}

      {/* Product Grid */}
      <div className="p-3 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-surface-tertiary dark:bg-dark-tertiary rounded-full flex items-center justify-center mb-4 text-ink-muted">
              <HelpCircle size={32} />
            </div>
            <h3 className="font-heading font-extrabold text-lg text-ink-primary dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-xs text-ink-secondary dark:text-gray-400 max-w-xs">
              There are no products in this subcategory filter. Check other filters or upload new designs.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={setSelectedProduct}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6 pb-6">
                <button
                  onClick={() => fetchProductsForFilter(activeFilter, page, true)}
                  disabled={loadingMore}
                  className="touch-manipulation px-6 py-2.5 bg-surface-primary dark:bg-dark-secondary text-ink-primary dark:text-white border border-surface-border dark:border-dark-border rounded-full text-xs font-bold shadow-sm active:scale-95 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-all duration-200 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-brand-500" />
                      Loading...
                    </>
                  ) : (
                    'Load More Designs'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Overlay Viewer */}
      {selectedProduct && (
        <ImageViewer
          product={selectedProduct}
          allProducts={filteredProducts}
          subcategories={subcategories}
          onClose={() => setSelectedProduct(null)}
          onChangeProduct={setSelectedProduct}
          onAssignProduct={handleAssignProduct}
        />
      )}
    </div>
  );
}
