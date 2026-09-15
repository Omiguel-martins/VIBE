import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('Quantidade máxima em estoque atingida para este produto.');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      if (product.stock <= 0) {
        alert('Este produto está esgotado.');
        return prev;
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCartItems(prev => {
      const item = prev.find(i => i.id === productId);
      if (item && qty > item.stock) {
        alert('Quantidade máxima em estoque atingida.');
        return prev;
      }
      return prev.map(i => i.id === productId ? { ...i, qty } : i);
    });
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartTotal, cartCount,
      isCartOpen, setIsCartOpen,
      addToCart, removeFromCart, updateQty
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
