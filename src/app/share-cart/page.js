'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useShareCart } from '../../context/ShareCartContext';
import { ChevronLeft, Trash2, Send, MessageCircle, Image as ImageIcon, FileText, X, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

export default function ShareCartPage() {
  const { cartItems, removeFromCart, clearCart, shareViaWhatsApp, cartCount } = useShareCart();
  const [showShareOptions, setShowShareOptions] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-surface-secondary dark:bg-dark-primary px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-surface-tertiary dark:bg-dark-tertiary flex items-center justify-center mb-6">
          <ShoppingBag size={36} className="text-ink-muted dark:text-gray-500" />
        </div>
        <h2 className="text-xl font-heading font-extrabold text-ink-primary dark:text-white mb-2">
          No designs bookmarked
        </h2>
        <p className="text-ink-secondary dark:text-gray-400 text-sm max-w-xs mb-6">
          Browse products and tap the bookmark icon on any item card to save them to this list.
        </p>
        <Link 
          href="/" 
          className="bg-ink-primary dark:bg-brand-600 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary dark:bg-dark-primary pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border bg-surface-primary dark:bg-dark-secondary sticky top-[56px] z-30">
        <div className="flex items-center space-x-1">
          <Link href="/" className="p-2 -ml-2 hover:bg-surface-secondary dark:hover:bg-dark-tertiary rounded-full transition-colors">
            <ChevronLeft size={24} className="text-ink-primary dark:text-white" />
          </Link>
          <h1 className="text-lg font-heading font-extrabold text-ink-primary dark:text-white">
            Shortlisted Items
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-secondary dark:text-gray-400">{cartCount} items</span>
          <button 
            onClick={clearCart}
            className="text-red-500 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="p-3 space-y-2 max-w-lg mx-auto">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-2xl p-3 transition-all"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-tertiary dark:bg-dark-tertiary shrink-0">
              <Image 
                src={item.imageUrl} 
                alt={item.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white truncate">
                {item.name}
              </h3>
              <p className="text-xs text-ink-secondary dark:text-gray-400 truncate">
                {[item.color, item.material].filter(Boolean).join(' • ') || 'Standard Model'}
              </p>
              {item.size && (
                <p className="text-[10px] text-ink-muted dark:text-gray-500 mt-0.5">{item.size}</p>
              )}
            </div>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors shrink-0"
              aria-label="Remove item"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Share Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-primary/95 dark:bg-dark-secondary/95 backdrop-blur-xl border-t border-surface-border dark:border-dark-border p-4 max-w-lg mx-auto rounded-t-2xl shadow-xl">
        {showShareOptions ? (
          <div className="space-y-2">
            <p className="text-xs text-ink-secondary dark:text-gray-400 text-center mb-3 font-bold">
              Choose WhatsApp Format
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  shareViaWhatsApp(true);
                  setShowShareOptions(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all text-xs"
              >
                <FileText size={16} />
                Send With Details
              </button>
              <button
                onClick={() => {
                  shareViaWhatsApp(false);
                  setShowShareOptions(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl active:scale-95 transition-all text-xs"
              >
                <ImageIcon size={16} />
                Images Only
              </button>
            </div>
            <button
              onClick={() => setShowShareOptions(false)}
              className="w-full text-center text-xs text-ink-secondary dark:text-gray-400 py-2 font-medium"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowShareOptions(true)}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl active:scale-95 transition-all shadow-lg shadow-green-500/20 text-sm"
          >
            <MessageCircle size={20} />
            Share Shortlist ({cartCount}) via WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
