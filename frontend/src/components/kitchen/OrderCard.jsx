import { useEffect, useState } from 'react';

function ageColor(createdAt) {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins < 5) return 'border-green-500';
  if (mins < 10) return 'border-yellow-500';
  return 'border-red-500';
}

function ageLabel(createdAt) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

export default function OrderCard({ order, onAccept, onServed, onItemPreparing, onItemReady }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const borderColor = ageColor(order.created_at);

  return (
    <div className={`bg-slate-800 rounded-xl border-l-8 ${borderColor} p-4 flex flex-col`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-3xl font-bold">T{order.table_number}</div>
          <div className="text-xs text-slate-400">Order #{order.id} · {ageLabel(order.created_at)}</div>
        </div>
        <div className="text-right text-xs">
          <div className="font-semibold uppercase">{order.status}</div>
          <div className="text-slate-400">{order.items_count} items</div>
        </div>
      </div>

      <ul className="space-y-2 flex-1">
        {(order.items || []).map((item) => (
          <li
            key={item.id}
            className={`p-2 rounded ${
              item.status === 'ready'
                ? 'bg-green-900/40 line-through text-green-300'
                : item.status === 'preparing'
                ? 'bg-yellow-900/40'
                : 'bg-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {item.quantity}× {item.name_snapshot}
              </div>
              <div className="text-xs text-slate-400">{item.status}</div>
            </div>
            {item.status !== 'ready' && (
              <div className="flex gap-2 mt-2">
                {item.status !== 'preparing' && (
                  <button
                    className="text-xs px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700"
                    onClick={() => onItemPreparing(item.id)}
                  >
                    Start
                  </button>
                )}
                <button
                  className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700"
                  onClick={() => onItemReady(item.id)}
                >
                  Ready
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        {order.status === 'pending' && (
          <button onClick={onAccept} className="btn-primary flex-1">Accept Order</button>
        )}
        {order.status === 'ready' && (
          <button onClick={onServed} className="btn-success flex-1">Mark Served</button>
        )}
      </div>
    </div>
  );
}
