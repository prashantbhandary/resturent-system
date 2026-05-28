import { useEffect, useState, useRef } from 'react';
import { kitchenApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import OrderCard from './OrderCard.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();
  const { user, logout } = useAuth();
  const audioRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await kitchenApi.list();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => {
      load();
      if (audioRef.current) {
        try { audioRef.current.play(); } catch (_e) { /* ignore */ }
      }
    };
    const onUpdate = () => load();
    socket.on('order:created', onNew);
    socket.on('kitchen:new-order', onNew);
    socket.on('order:status-changed', onUpdate);
    socket.on('order:item-status', onUpdate);
    socket.on('bill:paid', onUpdate);
    return () => {
      socket.off('order:created', onNew);
      socket.off('kitchen:new-order', onNew);
      socket.off('order:status-changed', onUpdate);
      socket.off('order:item-status', onUpdate);
      socket.off('bill:paid', onUpdate);
    };
  }, [socket]);

  const accept = async (order_id) => {
    await kitchenApi.setOrderStatus(order_id, 'accepted');
    load();
  };
  const markServed = async (order_id) => {
    await kitchenApi.setOrderStatus(order_id, 'served');
    load();
  };
  const itemAction = async (order_id, item_id, status) => {
    await kitchenApi.setItemStatus(order_id, item_id, status);
    load();
  };

  // beep tone via data URI
  const beep = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAAA=';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">👨‍🍳 Kitchen Display</h1>
          <div className="text-xs text-slate-400">
            {connected ? '🟢 Connected' : '🔴 Disconnected'} · {orders.length} active orders
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm">{user.name}</span>}
          <button onClick={logout} className="btn-secondary text-sm">Logout</button>
        </div>
      </header>
      <audio ref={audioRef} src={beep} preload="auto" />
      <main className="p-4">
        {loading ? (
          <LoadingSpinner label="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="text-center text-slate-400 py-20">
            <div className="text-5xl mb-4">🍽️</div>
            <p>No active orders. Waiting for new orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={() => accept(order.id)}
                onServed={() => markServed(order.id)}
                onItemPreparing={(i) => itemAction(order.id, i, 'preparing')}
                onItemReady={(i) => itemAction(order.id, i, 'ready')}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
