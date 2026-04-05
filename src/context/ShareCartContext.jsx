import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ShareCartContext = createContext();

export function ShareCartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('nww_share_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nww_share_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      return [...prev, {
        id: product.id,
        name: product.name,
        color: product.color || '',
        material: product.material || '',
        size: product.size || '',
        price: product.price,
        imageUrl: product.imageUrl,
        imageUrls: product.imageUrls || [product.imageUrl],
      }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(p => p.id !== productId));
  }, []);

  const isInCart = useCallback((productId) => {
    return cartItems.some(p => p.id === productId);
  }, [cartItems]);

  const toggleCart = useCallback((product) => {
    if (isInCart(product.id)) {
      removeFromCart(product.id);
    } else {
      addToCart(product);
    }
  }, [isInCart, removeFromCart, addToCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const shareViaWhatsApp = useCallback((withDetails = true) => {
    if (cartItems.length === 0) return;

    let message = '';

    if (withDetails) {
      message = `🏭 *National Welding Works — Product List*\n\n`;
      cartItems.forEach((item, i) => {
        message += `*${i + 1}. ${item.name}*\n`;
        if (item.color) message += `   Color: ${item.color}\n`;
        if (item.material) message += `   Material: ${item.material}\n`;
        if (item.size) message += `   Size: ${item.size}\n`;
        if (item.price) message += `   Price: ₹${item.price.toLocaleString('en-IN')}\n`;
        // Include first image URL
        if (item.imageUrl) message += `   📸 ${item.imageUrl}\n`;
        message += '\n';
      });
      message += `📦 Total items: ${cartItems.length}\n`;
      message += `📞 Contact: National Welding Works`;
    } else {
      message = `🏭 *NWW Products (${cartItems.length} items)*\n\n`;
      cartItems.forEach((item, i) => {
        message += `${i + 1}. ${item.name}\n`;
        if (item.imageUrl) message += `   ${item.imageUrl}\n`;
      });
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }, [cartItems]);

  return (
    <ShareCartContext.Provider value={{
      cartItems,
      cartCount: cartItems.length,
      addToCart,
      removeFromCart,
      isInCart,
      toggleCart,
      clearCart,
      shareViaWhatsApp,
    }}>
      {children}
    </ShareCartContext.Provider>
  );
}

export const useShareCart = () => useContext(ShareCartContext);
