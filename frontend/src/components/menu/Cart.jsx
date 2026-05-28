import { useCart } from '../../context/CartContext';

export default function Cart({ open, onClose, onSubmit }) {
  const { items, setQuantity, remove, subtotal, clear } = useCart();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-bold">Your Cart</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <p className="text-center text-slate-500 py-6">Cart is empty.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li key={it.item_id} className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-slate-500">₹{it.price} × {it.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="w-7 h-7 rounded-full bg-slate-200"
                      onClick={() => setQuantity(it.item_id, it.quantity - 1)}
                    >-</button>
                    <span className="w-6 text-center">{it.quantity}</span>
                    <button
                      className="w-7 h-7 rounded-full bg-slate-200"
                      onClick={() => setQuantity(it.item_id, it.quantity + 1)}
                    >+</button>
                    <button
                      className="ml-2 text-red-500 text-sm"
                      onClick={() => remove(it.item_id)}
                    >Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-4 py-3 space-y-3">
          <div className="flex justify-between font-bold">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clear} className="btn-secondary flex-1" disabled={items.length === 0}>
              Clear
            </button>
            <button onClick={onSubmit} className="btn-primary flex-1" disabled={items.length === 0}>
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
