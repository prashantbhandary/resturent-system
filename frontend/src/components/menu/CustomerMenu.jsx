import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Search, ShoppingCart, Utensils, X } from 'lucide-react';
import { menuApi, orderApi, billingApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { useConfig } from '../../context/ConfigContext';
import { useToast } from '../ui/toast';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/utils';
import MenuItemCard from './MenuItem.jsx';
import Cart from './Cart.jsx';
import OrderStatus from './OrderStatus.jsx';

function MenuSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CustomerMenu({ tableId }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const cart = useCart();
  const { socket } = useSocket();
  const { config } = useConfig();
  const { toast } = useToast();

  const loadOrders = async () => {
    try {
      const { data } = await orderApi.getForTable(tableId);
      setOrders(data.orders || []);
    } catch (_) {
      /* silent */
    }
  };

  useEffect(() => {
    Promise.all([menuApi.getMenu(), orderApi.getForTable(tableId)])
      .then(([menuRes, ordersRes]) => {
        setCategories(menuRes.data.categories);
        if (menuRes.data.categories[0]) setActiveCat(menuRes.data.categories[0].id);
        setOrders(ordersRes.data.orders || []);
      })
      .finally(() => setLoading(false));
  }, [tableId]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadOrders();
    socket.on('order:status-changed', refresh);
    socket.on('order:item-status', refresh);
    socket.on('bill:paid', refresh);
    return () => {
      socket.off('order:status-changed', refresh);
      socket.off('order:item-status', refresh);
      socket.off('bill:paid', refresh);
    };
  }, [socket, tableId]);

  const activeCategory = categories.find((c) => c.id === activeCat);

  const filteredItems = useMemo(() => {
    if (!activeCategory) return [];
    if (!search.trim()) return activeCategory.items;
    const q = search.toLowerCase();
    return activeCategory.items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)
    );
  }, [activeCategory, search]);

  const qtyOf = (id) => cart.items.find((i) => i.item_id === id)?.quantity || 0;

  const submitOrder = async () => {
    if (cart.items.length === 0) return;
    try {
      const { data } = await orderApi.create({
        table_id: parseInt(tableId, 10),
        items: cart.items.map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
      });
      cart.clear();
      setCartOpen(false);
      setOrders((prev) => [data.order, ...prev]);
      setOrdersOpen(true);
      toast({ title: 'Order placed!', description: 'Your order is being prepared.', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to place order', description: e.response?.data?.error || 'Please try again.', variant: 'error' });
    }
  };

  const requestBill = async (order_id) => {
    try {
      await billingApi.requestBill(order_id);
      toast({ title: 'Bill requested', description: 'Staff will bring your bill shortly.', variant: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: e.response?.data?.error || 'Could not request bill.', variant: 'error' });
    }
  };

  const activeOrders = orders.filter((o) => !['paid', 'cancelled'].includes(o.status));

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero — the first taste of the place */}
      <div className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-orange-700 via-primary to-amber-500 px-4 pb-10 pt-6 text-white shadow-hero">
        <div className="texture-dots pointer-events-none absolute inset-0 text-white/[0.07]" />
        <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-orange-950/30 blur-3xl" />
        {/* floating garnish */}
        <span className="pointer-events-none absolute right-6 top-16 animate-float text-2xl opacity-30 [animation-delay:0.5s]">🌿</span>
        <span className="pointer-events-none absolute right-20 top-7 animate-float text-xl opacity-20">✨</span>
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner backdrop-blur">
              <Utensils size={19} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">Welcome to</p>
              <h1 className="font-display text-2xl font-semibold leading-tight">{config.restaurant_name}</h1>
              <p className="mt-0.5 text-xs italic text-white/75">Cooked fresh, the moment you order</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeOrders.length > 0 && (
              <button
                onClick={() => setOrdersOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors hover:bg-white/25"
              >
                My Orders
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                  {activeOrders.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-transform hover:scale-105"
            >
              <ShoppingCart size={16} />
              <AnimatePresence>
                {cart.count > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                  >
                    {cart.count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-2">
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            🍽️ Table {tableId}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <Leaf size={12} /> Veg &amp; Non-veg
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>
            Kitchen open
          </span>
        </div>
      </div>

      {/* Sticky search + categories */}
      <header
        data-theme-surface
        className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md"
      >
        <div className="px-4 pb-2 pt-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border-0 bg-secondary pl-8 focus-visible:ring-1"
              placeholder="Search dishes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3 pt-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCat(c.id);
                setSearch('');
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCat === c.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      </header>

      {/* My Orders */}
      <AnimatePresence>
        {ordersOpen && activeOrders.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-secondary/50"
          >
            <div className="space-y-3 p-4">
              <h2 className="text-sm font-semibold">Active Orders</h2>
              {activeOrders.map((o) => (
                <OrderStatus key={o.id} order={o} onRequestBill={() => requestBill(o.id)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu grid */}
      <div className="px-4 pt-4">
        {activeCategory && !search && (
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {activeCategory.icon} {activeCategory.name}
            </h2>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {filteredItems.length} dish{filteredItems.length === 1 ? '' : 'es'}
            </span>
          </div>
        )}

        {loading ? (
          <MenuSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search size={36} strokeWidth={1.5} className="mb-3" />
            <p className="text-sm">No items found{search ? ` for "${search}"` : ''}</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {filteredItems.map((item, idx) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  categoryName={activeCategory?.name}
                  index={idx}
                  quantity={qtyOf(item.id)}
                  onAdd={() => cart.add(item)}
                  onInc={() => cart.setQuantity(item.id, qtyOf(item.id) + 1)}
                  onDec={() => cart.setQuantity(item.id, qtyOf(item.id) - 1)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating cart bar */}
      <AnimatePresence>
        {cart.count > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 z-10"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="glow-primary flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-orange-600 to-primary px-5 py-4 text-primary-foreground"
            >
              <div className="flex items-center gap-3">
                <span key={cart.count} className="animate-pop rounded-lg bg-white/25 px-2.5 py-0.5 text-sm font-bold tabular-nums">
                  {cart.count}
                </span>
                <span className="font-semibold">View your order</span>
              </div>
              <span className="font-display text-lg font-semibold">{formatCurrency(cart.subtotal)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Cart open={cartOpen} onClose={() => setCartOpen(false)} onSubmit={submitOrder} />
    </div>
  );
}
