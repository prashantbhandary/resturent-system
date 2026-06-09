import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, ChefHat, Flame } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { orderAgeMinutes } from '../../lib/utils';

function AgeBadge({ createdAt }) {
  const [mins, setMins] = useState(orderAgeMinutes(createdAt));
  useEffect(() => {
    const t = setInterval(() => setMins(orderAgeMinutes(createdAt)), 30000);
    return () => clearInterval(t);
  }, [createdAt]);

  if (mins < 5) return <Badge variant="success"><Clock size={10} className="mr-1" />{mins}m</Badge>;
  if (mins < 10) return <Badge variant="warning"><Clock size={10} className="mr-1" />{mins}m</Badge>;
  return <Badge variant="destructive"><Flame size={10} className="mr-1" />{mins}m</Badge>;
}

const STATUS_COLORS = {
  pending:   'border-l-slate-400',
  accepted:  'border-l-blue-500',
  preparing: 'border-l-amber-500',
  ready:     'border-l-emerald-500',
};

export default function OrderCard({ order, onAccept, onServed, onItemPreparing, onItemReady }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`bg-slate-800 rounded-2xl border-l-4 ${STATUS_COLORS[order.status] || 'border-l-slate-500'} overflow-hidden`}
    >
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <span className="text-2xl font-black text-primary">T{order.table_number}</span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Order #{order.id}</p>
            <p className="text-xs text-slate-400">{order.items_count} items</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <AgeBadge createdAt={order.created_at} />
          <span className="text-xs font-semibold uppercase text-slate-300">{order.status}</span>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {(order.items || []).map((item) => (
          <div
            key={item.id}
            className={`rounded-xl p-2.5 transition-colors ${
              item.status === 'ready'
                ? 'bg-emerald-900/30 border border-emerald-800/50'
                : item.status === 'preparing'
                ? 'bg-amber-900/30 border border-amber-800/50'
                : 'bg-slate-700/60 border border-slate-600/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-semibold text-sm ${item.status === 'ready' ? 'line-through text-slate-400' : 'text-white'}`}>
                {item.quantity}× {item.name_snapshot}
              </span>
              <span className={`text-xs ${item.status === 'ready' ? 'text-emerald-400' : item.status === 'preparing' ? 'text-amber-400' : 'text-slate-400'}`}>
                {item.status}
              </span>
            </div>
            {item.status !== 'ready' && (
              <div className="flex gap-1.5">
                {item.status !== 'preparing' && (
                  <button
                    onClick={() => onItemPreparing(item.id)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
                  >
                    <ChefHat size={11} /> Start
                  </button>
                )}
                <button
                  onClick={() => onItemReady(item.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                >
                  <CheckCircle size={11} /> Ready
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-3 pb-3">
        {order.status === 'pending' && (
          <Button onClick={onAccept} className="w-full" size="sm">Accept Order</Button>
        )}
        {order.status === 'ready' && (
          <Button onClick={onServed} variant="success" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            Mark as Served
          </Button>
        )}
      </div>
    </motion.div>
  );
}
