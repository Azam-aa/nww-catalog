import { useShopMode } from '../../context/ShopModeContext';
import { formatPrice } from '../../utils/formatPrice';
import { useDrag } from '@use-gesture/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteProduct } from '../../firebase/products';

export function DetailsBottomSheet({ product, isOpen, onClose }) {
  const { shopMode } = useShopMode();
  const navigate = useNavigate();

  const bind = useDrag(({ swipe: [, sy] }) => {
    if (sy === 1) onClose(); // swipe down
  });

  const handleEdit = () => {
    onClose();
    navigate('/admin', { state: { product } });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteProduct(product.id);
        alert('Product deleted successfully! Refresh the page to see changes.');
        onClose();
        window.location.reload();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  return (
    <div 
      className={`absolute inset-x-0 bottom-0 bg-surface-primary/95 dark:bg-dark-secondary/95 backdrop-blur-xl rounded-t-3xl shadow-2xl transition-transform duration-300 transform ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      } z-20`}
      {...bind()}
    >
      <div className="w-full pt-3 pb-8 px-6 touch-none">
        <div className="w-12 h-1.5 bg-surface-border dark:bg-dark-border rounded-full mx-auto mb-6" />
        
        <h3 className="text-xl font-heading font-bold text-ink-primary dark:text-white mb-4">
          {product.name}
        </h3>
        
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-secondary dark:text-gray-400">Material</span>
            <span className="font-medium text-ink-primary dark:text-white">{product.material || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary dark:text-gray-400">Color</span>
            <span className="font-medium text-ink-primary dark:text-white">{product.color || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary dark:text-gray-400">Size</span>
            <span className="font-medium text-ink-primary dark:text-white">{product.size || '-'}</span>
          </div>
        </div>
        
        {product.description && (
          <div className="mb-6">
            <p className="text-ink-secondary dark:text-gray-300 leading-relaxed text-sm">
              {product.description}
            </p>
          </div>
        )}

        {shopMode && (
          <div className="border-l-4 border-brand-500 pl-4 py-1 space-y-2 text-sm bg-brand-50/50 dark:bg-brand-900/10 -ml-4 p-4 rounded-r-lg">
            <div className="flex justify-between items-center">
              <span className="text-ink-secondary dark:text-gray-400">Selling Price</span>
              <span className="font-bold text-brand-600 dark:text-brand-500 text-base">
                {formatPrice(product.price)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-secondary dark:text-gray-400">Cost Price</span>
              <span className="font-medium text-ink-primary dark:text-gray-300">
                {formatPrice(product.costPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-brand-100 dark:border-brand-900/30">
              <span className="text-ink-secondary dark:text-gray-400">Margin</span>
              <span className="font-bold text-brand-500">
                {formatPrice(product.margin)}
              </span>
            </div>

            {/* Admin Controls */}
            <div className="flex gap-2 pt-4 mt-2 border-t border-brand-200 dark:border-brand-900/50">
              <button 
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-500 rounded-lg hover:bg-brand-200 dark:hover:bg-brand-900/50 transition-colors"
              >
                <Pencil size={16} /> Edit
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
