'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAdmin } from '../../context/AdminContext';
import { useShareCart } from '../../context/ShareCartContext';
import { formatPrice } from '../../utils/formatPrice';
import { Bookmark, BookmarkCheck } from 'lucide-react';

const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyZTJlMmEiLz48L3N2Zz4=';

export function ProductCard({ product, onClick }) {
  const { isAdmin } = useAdmin();
  const { isInCart, toggleCart } = useShareCart();
  const [isLoaded, setIsLoaded] = useState(false);

  const saved = isInCart(product.id);
  const displayTitle = product.title || 'Furniture Design';
  const displayImage = product.image_url;

  const handleSave = (e) => {
    e.stopPropagation();
    toggleCart(product);
  };

  return (
    <div 
      className="relative aspect-square w-full rounded-2xl overflow-hidden cursor-pointer bg-surface-tertiary dark:bg-dark-tertiary shadow-sm active:scale-95 hover:shadow-md transition-all duration-200 border border-surface-border dark:border-dark-border"
      onClick={() => onClick(product)}
    >
      {/* Skeleton / Blur Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-surface-border dark:bg-dark-border animate-pulse" />
      )}
      
      {/* Optimized Image */}
      <Image
        src={displayImage}
        alt={displayTitle}
        fill
        sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 250px"
        placeholder="blur"
        blurDataURL={BLUR_PLACEHOLDER}
        className={`object-cover transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />

      {/* Bookmark Button */}
      <button
        onClick={handleSave}
        className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors z-10 active:scale-90"
        aria-label={saved ? 'Remove from share list' : 'Save to share list'}
      >
        {saved ? (
          <BookmarkCheck size={16} className="text-brand-400 fill-brand-400" />
        ) : (
          <Bookmark size={16} className="text-white/80" />
        )}
      </button>

      {/* Gradient Bottom Overlay */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

      {/* Card Content Footer */}
      <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end">
        <h3 className="text-white font-heading font-extrabold text-[13px] leading-tight line-clamp-2 mb-0.5">
          {displayTitle}
        </h3>
        <p className="text-white/80 text-[10px] leading-tight truncate">
          {[product.color, product.material].filter(Boolean).join(' • ') || 'Standard Model'}
        </p>
      </div>

      {/* Admin Price Tag */}
      {isAdmin && product.price && (
        <div className="absolute top-2.5 left-2.5 bg-brand-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-md z-10">
          {formatPrice(product.price)}
        </div>
      )}
    </div>
  );
}
