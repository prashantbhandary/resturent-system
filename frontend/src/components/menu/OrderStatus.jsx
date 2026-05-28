const STATUS_LABEL = {
  pending: { label: 'Order Received', color: 'bg-slate-100 text-slate-700' },
  accepted: { label: 'Accepted by Kitchen', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800' },
  ready: { label: 'Ready to Serve', color: 'bg-green-100 text-green-700' },
  served: { label: 'Served', color: 'bg-emerald-100 text-emerald-700' },
  paid: { label: 'Paid ✓', color: 'bg-emerald-100 text-emerald-700' },
};

export default function OrderStatus({ order, onRequestBill }) {
  const s = STATUS_LABEL[order.status] || STATUS_LABEL.pending;
  const canRequestBill = ['served', 'ready', 'preparing', 'accepted'].includes(order.status);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Order #{order.id}</div>
          <div className={`badge mt-1 ${s.color}`}>{s.label}</div>
        </div>
        <div className="text-right">
          <div className="font-bold">₹{(order.total || 0).toFixed(2)}</div>
          <div className="text-xs text-slate-500">{order.items_count} items</div>
        </div>
      </div>
      {order.items && (
        <ul className="mt-2 text-sm space-y-1">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between text-slate-600">
              <span>{it.quantity}× {it.name_snapshot}</span>
              <span className="text-xs italic text-slate-400">{it.status}</span>
            </li>
          ))}
        </ul>
      )}
      {canRequestBill && order.status !== 'paid' && (
        <button onClick={onRequestBill} className="btn-secondary w-full mt-3 text-sm">
          Request Bill
        </button>
      )}
    </div>
  );
}
