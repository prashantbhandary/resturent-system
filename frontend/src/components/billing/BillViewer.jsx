import { X, Banknote, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../lib/utils';

export default function BillViewer({ bill, order, onPay, onClose }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Bill #{bill.id}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">Table {bill.table_number}</span>
            <Badge variant="warning">Pending Payment</Badge>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary transition-colors text-muted-foreground">
          <X size={18} />
        </button>
      </div>

      {/* Line items */}
      <div className="p-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left pb-2 font-medium">Item</th>
              <th className="text-center pb-2 font-medium w-12">Qty</th>
              <th className="text-right pb-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(order?.items || []).map((it) => (
              <tr key={it.id}>
                <td className="py-2.5">{it.name_snapshot}</td>
                <td className="py-2.5 text-center text-muted-foreground">{it.quantity}</td>
                <td className="py-2.5 text-right font-medium">{formatCurrency(it.price_at_time * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-2">
          <Separator />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (13%)</span><span>{formatCurrency(bill.tax)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(bill.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment buttons */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-3">
        <Button
          size="lg"
          variant="outline"
          onClick={() => onPay('cash')}
          className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <Banknote size={18} /> Cash Paid
        </Button>
        <Button
          size="lg"
          onClick={() => onPay('card')}
          className="gap-2 shadow-lg shadow-primary/20"
        >
          <CreditCard size={18} /> Card Paid
        </Button>
      </div>
    </div>
  );
}
