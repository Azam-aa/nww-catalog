import { useState, useRef, useEffect } from 'react';
import { useShopMode } from '../../context/ShopModeContext';
import { formatPrice } from '../../utils/formatPrice';

export function ProductCard({ product, onClick }) {
  const { shopMode } = useShopMode();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef();

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
        <div className="absolute top-2 right-2 bg-brand-500 text-white text-[12px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {formatPrice(product.price)}
        </div>
      )}
    </div>
  );
}
