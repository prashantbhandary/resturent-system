const TOKEN_KEY = 'restaurant_token';
const USER_KEY = 'restaurant_user';
const CART_KEY = 'restaurant_cart';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  setUser: (u) => (u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY)),
  getCart: (tableId) => {
    const raw = localStorage.getItem(`${CART_KEY}_${tableId}`);
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  },
  setCart: (tableId, items) => {
    if (!items || items.length === 0) localStorage.removeItem(`${CART_KEY}_${tableId}`);
    else localStorage.setItem(`${CART_KEY}_${tableId}`, JSON.stringify(items));
  },
};
