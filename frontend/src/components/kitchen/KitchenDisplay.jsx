import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, ChefHat, LogOut, RefreshCw } from 'lucide-react';
import { kitchenApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/toast';
import OrderCard from './OrderCard.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const FILTERS = ['all', 'pending', 'accepted', 'preparing', 'ready'];

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { socket, connected } = useSocket();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const audioCtxRef = useRef(null);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch (_) { /* user hasn't interacted yet */ }
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await kitchenApi.list();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => { load(true); playBeep(); };
    const onUpdate = () => load(true);
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

  const accept = async (id) => {
    await kitchenApi.setOrderStatus(id, 'accepted');
    load(true);
    toast({ title: 'Order accepted', variant: 'success' });
  };
  const markServed = async (id) => {
    await kitchenApi.setOrderStatus(id, 'served');
    load(true);
    toast({ title: 'Marked as served', variant: 'success' });
  };
  const itemAction = async (order_id, item_id, status) => {
    await kitchenApi.setItemStatus(order_id, item_id, status);
    load(true);
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? orders.length : orders.filter((o) => o.status === f).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700 px-5 py-3 flex items-center justify-between bg-slate-900/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <ChefHat size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Kitchen Display</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {connected
                ? <><Wifi size={11} className="text-emerald-400" /><span className="text-xs text-emerald-400">Live</span></>
                : <><WifiOff size={11} className="text-red-400" /><span className="text-xs text-red-400">Disconnected</span></>
              }
              <span className="text-xs text-slate-500">· {orders.length} active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-400"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <span className="text-sm text-slate-400 hidden sm:block">{user?.name}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide px-5 py-2.5 border-b border-slate-700/50">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f ? 'bg-white/20' : 'bg-slate-700'}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders grid */}
      <main className="flex-1 p-4">
        {loading ? (
          <LoadingSpinner label="Loading orders…" className="text-slate-400 mt-12" />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-slate-500"
          >
            <ChefHat size={48} strokeWidth={1} className="mb-4" />
            <p className="text-lg font-medium">No {filter === 'all' ? 'active' : filter} orders</p>
            <p className="text-sm mt-1">Waiting for new orders…</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => accept(order.id)}
                  onServed={() => markServed(order.id)}
                  onItemPreparing={(itemId) => itemAction(order.id, itemId, 'preparing')}
                  onItemReady={(itemId) => itemAction(order.id, itemId, 'ready')}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
