'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Share2, ZoomIn, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { DetailsBottomSheet } from './DetailsBottomSheet';
import { useDrag } from '@use-gesture/react';
import { useShareCart } from '../../context/ShareCartContext';
import { useAdmin } from '../../context/AdminContext';

export function ImageViewer({ 
  product, 
  allProducts = [], 
  subcategories = [],
  onClose,
  onChangeProduct,
  onAssignProduct
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { bindPinch, scale, offset, imageRef, handleDoubleTap } = usePinchZoom();
  const { isInCart, toggleCart } = useShareCart();
  const { isAdmin } = useAdmin();

  // Subcategory assignment states
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [tempSubCategoryId, setTempSubCategoryId] = useState(product?.subcategory_id || '');
  const [assigning, setAssigning] = useState(false);

  // Carousel images
  const allImages = product?.imageUrls?.length > 0 ? product.imageUrls : [product?.image_url || product?.imageUrl];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index and dropdown when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setTempSubCategoryId(product?.subcategory_id || '');
    setShowAssignDropdown(false);
  }, [product?.id]);

  const currentIndex = allProducts.findIndex(p => p.id === product?.id);
  const saved = product ? isInCart(product.id) : false;

  const goToImage = useCallback((index) => {
    if (index >= 0 && index < allImages.length) {
      setCurrentImageIndex(index);
    }
  }, [allImages.length]);

  const bindDrag = useDrag(({ swipe: [sx, sy] }) => {
    if (scale > 1) return;
    
    // swipe down to close
    if (sy === 1) {
      onClose();
      return;
    }

    // If multiple images, horizontal swipe changes image
    if (allImages.length > 1) {
      if (sx === -1 && currentImageIndex < allImages.length - 1) {
        goToImage(currentImageIndex + 1);
        return;
      }
      if (sx === 1 && currentImageIndex > 0) {
        goToImage(currentImageIndex - 1);
        return;
      }
    }

    // If at first/last image (or single image), swipe changes product
    if (sx === -1 && currentImageIndex === allImages.length - 1 && currentIndex < allProducts.length - 1) {
      onChangeProduct(allProducts[currentIndex + 1]);
    }
    if (sx === 1 && currentImageIndex === 0 && currentIndex > 0) {
      onChangeProduct(allProducts[currentIndex - 1]);
    }
  });

  const handleShare = async (e) => {
    e.stopPropagation();
    if (navigator.share) {
      await navigator.share({
        title: product.title || 'Steel Furniture',
        text: `Check out this design from National Welding Works: ${product.title || ''}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          subcategoryId: tempSubCategoryId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert('Product assigned successfully!');
        setShowAssignDropdown(false);
        if (onAssignProduct) {
          onAssignProduct(product.id, tempSubCategoryId || null);
        }
      } else {
        const errorData = await res.json();
        alert('Failed to assign: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error during assignment: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black touch-none">
      {/* Top Bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="p-2 text-white/90 active:scale-95">
          <X size={26} />
        </button>
        <h2 className="text-white font-heading font-extrabold truncate px-4 flex-1 text-center">
          {product.title || 'Product View'}
        </h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleCart(product); }} 
            className="p-2 text-white/90 active:scale-95"
          >
            {saved ? (
              <BookmarkCheck size={24} className="text-brand-400 fill-brand-400" />
            ) : (
              <Bookmark size={24} />
            )}
          </button>
          <button onClick={handleShare} className="p-2 text-white/90 active:scale-95">
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        {...bindDrag()}
        onClick={() => {
          if (scale === 1) setShowDetails(!showDetails);
        }}
        onDoubleClick={handleDoubleTap}
      >
        <img
          ref={imageRef}
          src={allImages[currentImageIndex]}
          alt={`${product.title || 'Product'} - Image ${currentImageIndex + 1}`}
          className="max-w-full max-h-full object-contain origin-center transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          {...bindPinch()}
        />
      </div>

      {/* Image Dots Indicator (for multi-image products) */}
      {allImages.length > 1 && (
        <div className="absolute bottom-[90px] inset-x-0 flex items-center justify-center gap-2 z-10">
          {allImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                goToImage(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Lazy Categorize Button for Admin */}
      {isAdmin && !showDetails && scale === 1 && (
        <div className="absolute bottom-[110px] inset-x-0 flex justify-center z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAssignDropdown(true);
            }}
            className="bg-brand-500 hover:bg-brand-650 text-white font-bold px-6 py-2.5 rounded-full text-xs shadow-lg active:scale-95 transition-transform"
          >
            Assign to Subcategory
          </button>
        </div>
      )}

      {/* Image Counter & Hint */}
      {showDetails === false && scale === 1 && (
        <div className="absolute bottom-[24px] inset-x-0 flex items-center justify-center z-10">
          <div className="bg-black/50 text-white/80 px-4 py-1.5 rounded-full text-xs flex items-center gap-2">
            {allImages.length > 1 && (
              <span className="font-medium">{currentImageIndex + 1}/{allImages.length}</span>
            )}
            <ZoomIn size={14} />
            Tap for details{allImages.length > 1 ? ', swipe for more images' : ', pinch to zoom'}
          </div>
        </div>
      )}

      {/* Save confirmation toast */}
      {saved && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-pulse">
          <div className="bg-brand-500/90 text-white text-xs px-3 py-1.5 rounded-full font-medium">
            ✓ Saved to share list
          </div>
        </div>
      )}

      {/* Assign Subcategory Dropdown Dialog */}
      {showAssignDropdown && (
        <div 
          className="absolute inset-0 bg-black/85 flex items-center justify-center p-6 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-surface-primary dark:bg-dark-secondary rounded-2xl p-6 w-full max-w-sm border border-surface-border dark:border-dark-border text-center shadow-xl">
            <h4 className="font-heading font-extrabold text-lg text-ink-primary dark:text-white mb-2">
              Categorize Item
            </h4>
            <p className="text-xs text-ink-secondary dark:text-gray-400 mb-6">
              Move this design to a specific subcategory.
            </p>
            
            <select
              value={tempSubCategoryId}
              onChange={(e) => setTempSubCategoryId(e.target.value)}
              className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-4 py-3 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm mb-6"
            >
              <option value="">-- Uncategorized (NULL) --</option>
              {subcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAssignDropdown(false)}
                className="flex-1 py-3 bg-surface-secondary dark:bg-dark-tertiary text-ink-primary dark:text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 active:scale-95 transition-transform"
              >
                {assigning ? 'Assigning...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DetailsBottomSheet 
        product={product} 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)} 
      />
    </div>
  );
}
