import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Share2, ZoomIn, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { DetailsBottomSheet } from './DetailsBottomSheet';
import { useDrag } from '@use-gesture/react';
import { useShareCart } from '../../context/ShareCartContext';

export function ImageViewer({ 
  product, 
  allProducts = [], 
  onClose,
  onChangeProduct 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { bindPinch, scale, offset, imageRef, handleDoubleTap } = usePinchZoom();
  const { isInCart, toggleCart } = useShareCart();

  // Multi-image carousel state
  const allImages = product?.imageUrls?.length > 0 ? product.imageUrls : [product?.imageUrl];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef(null);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
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

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: `Check out ${product.name}`,
        url: window.location.href,
      }).catch(console.error);
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
        <h2 className="text-white font-heading font-medium truncate px-4 flex-1 text-center">
          {product.name}
        </h2>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => toggleCart(product)} 
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
          alt={`${product.name} - Image ${currentImageIndex + 1}`}
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

      <DetailsBottomSheet 
        product={product} 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)} 
      />
    </div>
  );
}
