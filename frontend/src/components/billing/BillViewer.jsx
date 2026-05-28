export default function BillViewer({ bill, order, onPay, onClose }) {
  return (
    <div>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="font-bold text-lg">Bill #{bill.id}</h2>
          <div className="text-xs text-slate-500">Table {bill.table_number}</div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
      </div>

      <ul className="space-y-1">
        {(order?.items || []).map((it) => (
          <li key={it.id} className="flex justify-between text-sm">
            <span>{it.quantity}× {it.name_snapshot}</span>
            <span>₹{(it.price_at_time * it.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="border-t mt-3 pt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Tax (13%)</span><span>₹{bill.tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-lg pt-2">
          <span>Total</span><span>₹{bill.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5">
        <button onClick={() => onPay('cash')} className="btn-success">💵 Cash Paid</button>
        <button onClick={() => onPay('card')} className="btn-primary">💳 Card Paid</button>
      </div>
    </div>
  );
}
