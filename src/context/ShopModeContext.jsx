import { createContext, useContext, useState, useEffect } from 'react';

const ShopModeContext = createContext();

export function ShopModeProvider({ children }) {
  const [shopMode, setShopMode] = useState(() => {
    const saved = localStorage.getItem('shopMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('shopMode', shopMode);
  }, [shopMode]);

  const toggleShopMode = () => setShopMode(prev => !prev);

  return (
    <ShopModeContext.Provider value={{ shopMode, toggleShopMode }}>
      {children}
    </ShopModeContext.Provider>
  );
}

export const useShopMode = () => useContext(ShopModeContext);
