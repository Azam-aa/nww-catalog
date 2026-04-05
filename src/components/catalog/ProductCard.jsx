import { useState, useRef, useEffect } from 'react';
import { useShopMode } from '../../context/ShopModeContext';
import { useShareCart } from '../../context/ShareCartContext';
import { formatPrice } from '../../utils/formatPrice';
import { Bookmark, BookmarkCheck, Layers } from 'lucide-react';

export function ProductCard({ product, onClick }) {
  const { shopMode } = useShopMode();
  const { isInCart, toggleCart } = useShareCart();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef();

  const saved = isInCart(product.id);
  const imageCount = product.imageUrls?.length || 1;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSave = (e) => {
    e.stopPropagation();
    toggleCart(product);
  };

  return (
    <div 
      className="relative aspect-square w-full rounded-xl overflow-hidden cursor-pointer bg-surface-tertiary dark:bg-dark-tertiary shadow-sm active:scale-95 transition-transform"
      onClick={() => onClick(product)}
      ref={imgRef}
    >
      {/* Image Skeleton / Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-surface-border dark:bg-dark-border animate-pulse" />
      )}
      
      {/* Image */}
      {isVisible && (
        <img
          src={product.thumbnailUrl || product.imageUrl}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}

      {/* Multi-image indicator */}
      {imageCount > 1 && (
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 z-10">
          <Layers size={10} />
          {imageCount}
        </div>
      )}

      {/* Bookmark button */}
      <button
        onClick={handleSave}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10 active:scale-90"
        aria-label={saved ? 'Remove from share list' : 'Save to share list'}
      >
        {saved ? (
          <BookmarkCheck size={16} className="text-brand-400 fill-brand-400" />
        ) : (
          <Bookmark size={16} className="text-white/80" />
        )}
      </button>

      {/* Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col justify-end">
        <h3 className="text-white font-heading font-bold text-[13px] leading-tight line-clamp-2 mb-0.5">
          {product.name}
        </h3>
        <p className="text-white/70 text-[11px] leading-tight truncate">
          {product.color} {product.material ? `• ${product.material}` : ''}
        </p>
      </div>

      {/* Shop Mode Price Badge */}
      {shopMode && product.price && (
        <div className="absolute bottom-2 right-2 bg-brand-500 text-white text-[12px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
          {formatPrice(product.price)}
        </div>
      )}
    </div>
  );
}
