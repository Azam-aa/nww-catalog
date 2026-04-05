import { useState } from 'react';
import { useShareCart } from '../context/ShareCartContext';
import { Link } from 'react-router-dom';
import { ChevronLeft, Trash2, Send, MessageCircle, Image, FileText, X, ShoppingBag } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

export function ShareCartPage() {
  const { cartItems, removeFromCart, clearCart, shareViaWhatsApp, cartCount } = useShareCart();
  const [showShareOptions, setShowShareOptions] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="pt-[56px] min-h-screen flex flex-col items-center justify-center bg-surface-secondary dark:bg-dark-primary px-6">
        <div className="w-20 h-20 rounded-full bg-surface-tertiary dark:bg-dark-tertiary flex items-center justify-center mb-6">
          <ShoppingBag size={36} className="text-ink-muted dark:text-gray-500" />
        </div>
        <h2 className="text-xl font-heading font-bold text-ink-primary dark:text-white mb-2">
          No products saved
        </h2>
        <p className="text-ink-secondary dark:text-gray-400 text-center text-sm mb-6">
          Browse products and tap the bookmark icon to save them here for sharing via WhatsApp.
        </p>
        <Link 
          to="/" 
          className="bg-ink-primary dark:bg-brand-600 text-white px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-[56px] min-h-screen bg-surface-secondary dark:bg-dark-primary pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border bg-surface-primary dark:bg-dark-secondary sticky top-[56px] z-30">
        <div className="flex items-center space-x-1">
          <Link to="/" className="p-1 -ml-1 hover:bg-surface-secondary dark:hover:bg-dark-tertiary rounded-full transition-colors">
            <ChevronLeft size={24} className="text-ink-primary dark:text-white" />
          </Link>
          <h1 className="text-lg font-heading font-bold text-ink-primary dark:text-white">
            Share List
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-secondary dark:text-gray-400">{cartCount} items</span>
          <button 
            onClick={clearCart}
            className="text-red-500 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="p-3 space-y-2">
        {cartItems.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-xl p-3 transition-all"
          >
            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-tertiary dark:bg-dark-tertiary shrink-0">
              <img 
                src={item.imageUrl} 
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-sm text-ink-primary dark:text-white truncate">
                {item.name}
              </h3>
              <p className="text-xs text-ink-secondary dark:text-gray-400 truncate">
                {[item.color, item.material].filter(Boolean).join(' • ') || 'No details'}
              </p>
              {item.size && (
                <p className="text-xs text-ink-muted dark:text-gray-500">{item.size}</p>
              )}
            </div>

            {/* Image Count Badge */}
            {item.imageUrls?.length > 1 && (
              <span className="text-[10px] bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                {item.imageUrls.length} imgs
              </span>
            )}

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Share Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-primary/95 dark:bg-dark-secondary/95 backdrop-blur-xl border-t border-surface-border dark:border-dark-border p-4">
        {showShareOptions ? (
          <div className="space-y-2">
            <p className="text-xs text-ink-secondary dark:text-gray-400 text-center mb-3 font-medium">
              How would you like to share?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  shareViaWhatsApp(true);
                  setShowShareOptions(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all"
              >
                <FileText size={18} />
                With Details
              </button>
              <button
                onClick={() => {
                  shareViaWhatsApp(false);
                  setShowShareOptions(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl active:scale-95 transition-all"
              >
                <Image size={18} />
                Images Only
              </button>
            </div>
            <button
              onClick={() => setShowShareOptions(false)}
              className="w-full text-center text-sm text-ink-secondary dark:text-gray-400 py-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowShareOptions(true)}
            className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={22} />
            Share {cartCount} Product{cartCount > 1 ? 's' : ''} via WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
