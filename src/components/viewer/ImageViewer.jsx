import { useEffect, useState } from 'react';
import { X, Share2, ZoomIn } from 'lucide-react';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { DetailsBottomSheet } from './DetailsBottomSheet';
import { useDrag } from '@use-gesture/react';

export function ImageViewer({ 
  product, 
  allProducts = [], 
  onClose,
  onChangeProduct 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { bindPinch, scale, offset, imageRef, handleDoubleTap } = usePinchZoom();

  const currentIndex = allProducts.findIndex(p => p.id === product?.id);

  const bindDrag = useDrag(({ swipe: [sx, sy] }) => {
    if (scale > 1) return; // disable swipe gestures when zoomed
    
    // swipe down to close
    if (sy === 1) {
      onClose();
      return;
    }
    // swipe left/right to change picture
    if (sx === -1 && currentIndex < allProducts.length - 1) {
      onChangeProduct(allProducts[currentIndex + 1]);
    }
    if (sx === 1 && currentIndex > 0) {
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
        <button onClick={handleShare} className="p-2 text-white/90 active:scale-95">
          <Share2 size={24} />
        </button>
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
          src={product.imageUrl}
          alt={product.name}
          className="max-w-full max-h-full object-contain origin-center transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          {...bindPinch()}
        />

        {showDetails === false && scale === 1 && (
          <div className="absolute bottom-[24px] bg-black/50 text-white/80 px-4 py-1.5 rounded-full text-xs flex items-center gap-2">
            <ZoomIn size={14} /> Tap for details, pinch/double-tap to zoom
          </div>
        )}
      </div>

      <DetailsBottomSheet 
        product={product} 
        isOpen={showDetails} 
        onClose={() => setShowDetails(false)} 
      />
    </div>
  );
}
