import { useEffect, useState, useMemo } from 'react';
import { menuApi, orderApi, billingApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import MenuItemCard from './MenuItem.jsx';
import Cart from './Cart.jsx';
import OrderStatus from './OrderStatus.jsx';

export default function CustomerMenu({ tableId }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const cart = useCart();
  const { socket } = useSocket();

  const loadOrders = async () => {
    try {
      const { data } = await orderApi.getForTable(tableId);
      setOrders(data.orders || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    menuApi.getMenu()
      .then(({ data }) => {
        setCategories(data.categories);
        if (data.categories[0]) setActiveCat(data.categories[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    loadOrders();
  }, [tableId]);

  useEffect(() => {
    if (!socket) return;
    const refresh = (payload) => {
      if (payload?.order?.table_id === parseInt(tableId, 10)
        || payload?.table_id === parseInt(tableId, 10)
        || payload?.order_id) {
        loadOrders();
      }
    };
    socket.on('order:status-changed', refresh);
    socket.on('order:item-status', refresh);
    socket.on('bill:paid', refresh);
    return () => {
      socket.off('order:status-changed', refresh);
      socket.off('order:item-status', refresh);
      socket.off('bill:paid', refresh);
    };
  }, [socket, tableId]);

  const filteredItems = useMemo(() => {
    const active = categories.find((c) => c.id === activeCat);
    if (!active) return [];
    if (!search) return active.items;
    const q = search.toLowerCase();
    return active.items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)
    );
  }, [categories, activeCat, search]);

  const submitOrder = async () => {
    if (cart.items.length === 0) return;
    setError('');
    try {
      const { data } = await orderApi.create({
        table_id: parseInt(tableId, 10),
        items: cart.items.map((i) => ({ item_id: i.item_id, quantity: i.quantity })),
      });
      cart.clear();
      setCartOpen(false);
      setOrders((prev) => [data.order, ...prev]);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to place order');
    }
  };

  const requestBill = async (order_id) => {
    try {
      await billingApi.requestBill(order_id);
      alert('Bill requested. Please wait for staff.');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to request bill');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🍽️ Our Menu</h1>
            <div className="text-xs text-slate-500">Table {tableId}</div>
          </div>
          <button onClick={() => setCartOpen(true)} className="btn-primary relative">
            🛒 Cart
            {cart.count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {cart.count}
              </span>
            )}
          </button>
        </div>
        <input
          className="input mt-3"
          placeholder="Search menu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {orders.length > 0 && (
        <div className="px-4 pt-4 space-y-2">
          {orders.map((o) => (
            <OrderStatus key={o.id} order={o} onRequestBill={() => requestBill(o.id)} />
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCat === c.id
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pt-2">
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onAdd={() => cart.add(item)} />
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-10">
            No items match your search.
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-20 left-4 right-4 rounded bg-red-100 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {cart.count > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 btn-primary py-3 shadow-lg"
        >
          View Cart ({cart.count}) — ₹{cart.subtotal.toFixed(2)}
        </button>
      )}

      <Cart open={cartOpen} onClose={() => setCartOpen(false)} onSubmit={submitOrder} />
    </div>
  );
}
