export default function Receipt({ receipt, onClose }) {
  const { invoice_no, bill, order, items, printed_at } = receipt;

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="flex justify-between items-center mb-3 no-print">
        <h2 className="font-bold text-lg">Receipt</h2>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-primary text-sm">🖨️ Print</button>
          <button onClick={onClose} className="btn-secondary text-sm">Close</button>
        </div>
      </div>

      <div className="print-area bg-white p-4 font-mono text-sm">
        <div className="text-center mb-3">
          <div className="text-lg font-bold">RESTAURANT</div>
          <div className="text-xs">Tax Invoice / Receipt</div>
        </div>
        <div className="text-xs">
          <div>Invoice: {invoice_no}</div>
          <div>Table: {bill.table_number}</div>
          <div>Date: {new Date(printed_at).toLocaleString()}</div>
          <div>Payment: {bill.payment_method?.toUpperCase()}</div>
        </div>
        <hr className="my-2 border-dashed" />
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left">Item</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.name_snapshot}</td>
                <td className="text-right">{it.quantity}</td>
                <td className="text-right">₹{(it.price_at_time * it.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr className="my-2 border-dashed" />
        <div className="text-xs space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{bill.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>₹{bill.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>₹{bill.total.toFixed(2)}</span></div>
        </div>
        <div className="text-center text-xs mt-3">Thank you! Visit again.</div>
      </div>
    </div>
  );
}
