'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAdmin } from '../../context/AdminContext';
import { ProductCard } from './ProductCard';
import { ImageViewer } from '../viewer/ImageViewer';
import { ChevronLeft, Upload, Loader2, HelpCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export function CategoryView({ category, subcategories, initialProducts }) {
  const { isAdmin } = useAdmin();
  const fileInputRef = useRef(null);

  // Local state for products so updates are immediate
  const [products, setProducts] = useState(initialProducts);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
    message: '',
  });

  // Filter products locally
  const filteredProducts = products.filter(product => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'uncategorized') return product.subcategory_id === null;
    return product.subcategory_id === activeFilter;
  });

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

  // Safe chunked image compression and uploading
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
    const CHUNK_SIZE = 50; // mobile safe chunk size

    try {
      // Loop over files in chunks
      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);

        for (let j = 0; j < chunk.length; j++) {
          const file = chunk[j];
          const currentIndex = i + j;

          setUploadProgress(prev => ({
            ...prev,
            current: currentIndex + 1,
            message: `Compressing image ${currentIndex + 1} of ${files.length}...`,
          }));

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
            message: `Uploading image ${currentIndex + 1} of ${files.length}... (Total uploaded: ${uploadedProducts.length})`,
          }));

          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to upload file "${file.name}"`);
          }

          const responseData = await res.json();
          if (responseData.product) {
            uploadedProducts.push(responseData.product);
          }
        }
      }

      // Prepend all successfully uploaded images
      setProducts(prev => [...uploadedProducts, ...prev]);
      alert(`Success! Successfully uploaded ${uploadedProducts.length} images.`);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
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
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              activeFilter === 'all'
                ? 'bg-ink-primary dark:bg-brand-500 text-white shadow-md'
                : 'bg-surface-secondary dark:bg-dark-tertiary text-ink-secondary dark:text-gray-400 border border-surface-border dark:border-dark-border'
            }`}
          >
            All ({products.length})
          </button>

          {/* UNASSIGNED Filter (Only visible to admin) */}
          {isAdmin && (
            <button
              onClick={() => setActiveFilter('uncategorized')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 flex items-center gap-1 ${
                activeFilter === 'uncategorized'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/30'
              }`}
            >
              Uncategorized ({products.filter(p => p.subcategory_id === null).length})
            </button>
          )}

          {/* Subcategory List Filters */}
          {subcategories.map(sub => {
            const subCount = products.filter(p => p.subcategory_id === sub.id).length;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveFilter(sub.id)}
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
        {filteredProducts.length === 0 ? (
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={setSelectedProduct}
              />
            ))}
          </div>
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
