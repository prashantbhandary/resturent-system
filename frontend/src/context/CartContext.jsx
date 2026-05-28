import { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../services/storage';

const CartContext = createContext(null);

export function CartProvider({ tableId, children }) {
  const [items, setItems] = useState(() => storage.getCart(tableId));

  useEffect(() => {
    storage.setCart(tableId, items);
  }, [tableId, items]);

  const add = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.item_id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.item_id === item.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [
        ...prev,
        { item_id: item.id, name: item.name, price: item.price, quantity },
      ];
    });
  };

  const setQuantity = (item_id, quantity) => {
    if (quantity <= 0) return remove(item_id);
    setItems((prev) =>
      prev.map((p) => (p.item_id === item_id ? { ...p, quantity } : p))
    );
  };

  const remove = (item_id) =>
    setItems((prev) => prev.filter((p) => p.item_id !== item_id));

  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, add, remove, setQuantity, clear, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
