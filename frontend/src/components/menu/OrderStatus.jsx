import { motion } from 'framer-motion';
import { Clock, ChefHat, Bell, CheckCircle, Receipt } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatCurrency, timeAgo } from '../../lib/utils';

const STEPS = [
  { key: 'pending', label: 'Received', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: Bell },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: CheckCircle },
  { key: 'served', label: 'Served', icon: CheckCircle },
];

const STATUS_META = {
  pending:   { badge: 'pending', text: 'Order received', emoji: '🧾' },
  accepted:  { badge: 'info', text: 'Accepted by kitchen', emoji: '🔔' },
  preparing: { badge: 'warning', text: 'Chef is cooking your food', emoji: '👨‍🍳' },
  ready:     { badge: 'success', text: 'Ready — coming to you!', emoji: '🛎️' },
  served:    { badge: 'success', text: 'Enjoy your meal!', emoji: '🍽️' },
  paid:      { badge: 'success', text: 'Paid — thank you!', emoji: '💛' },
};

function stepIndex(status) {
  return STEPS.findIndex((s) => s.key === status);
}

export default function OrderStatus({ order, onRequestBill }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const currentStep = stepIndex(order.status);
  const canRequestBill = ['served', 'ready', 'preparing', 'accepted'].includes(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4 shadow-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2.5">
          {/* the cooking moment, animated */}
          <div className="relative mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-lg">
            {order.status === 'preparing' && (
              <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-[9px]">
                <span className="inline-block animate-steam">♨️</span>
              </span>
            )}
            <span className={order.status === 'preparing' ? 'animate-pulse' : ''}>{meta.emoji}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Order #{order.id}</span>
              <Badge variant={meta.badge}>{meta.text}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo(order.created_at)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-base font-semibold text-primary">{formatCurrency(order.total)}</p>
          <p className="text-xs text-muted-foreground">{order.items_count} items</p>
        </div>
      </div>

      {/* Step tracker */}
      {order.status !== 'paid' && order.status !== 'cancelled' && (
        <div className="flex items-center gap-1 mb-3">
          {STEPS.slice(0, 4).map((step, i) => {
            const done = i <= currentStep;
            return (
              <div key={step.key} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                    done ? 'bg-gradient-to-r from-orange-500 to-primary' : 'bg-secondary'
                  }`}
                />
                {i === STEPS.slice(0, 4).length - 1 && (
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-500 ${done ? 'bg-primary' : 'bg-secondary'}`}>
                    {done && <CheckCircle size={10} className="text-white" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Items */}
      {order.items && (
        <ul className="space-y-1 mb-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{it.quantity}× {it.name_snapshot}</span>
              <span className={`text-xs font-medium ${it.status === 'ready' ? 'text-emerald-600' : it.status === 'preparing' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {it.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      {canRequestBill && order.status !== 'paid' && (
        <Button variant="outline" size="sm" onClick={onRequestBill} className="w-full gap-2">
          <Receipt size={14} /> Request Bill
        </Button>
      )}
    </motion.div>
  );
}
