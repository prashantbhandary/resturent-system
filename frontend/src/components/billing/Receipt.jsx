import { Printer, X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../lib/utils';

export default function ReceiptView({ receipt, onClose }) {
  const { invoice_no, bill, order, items, printed_at } = receipt;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} className="text-emerald-500" />
          <h2 className="font-bold text-lg">Payment Received</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer size={14} /> Print
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            <X size={14} /> Close
          </Button>
        </div>
      </div>

      {/* Receipt card */}
      <div className="print-area border border-border rounded-2xl overflow-hidden">
        {/* Receipt header */}
        <div className="bg-gradient-to-r from-primary to-amber-500 text-white p-6 text-center">
          <h1 className="text-2xl font-black">DineQR</h1>
          <p className="text-sm opacity-80 mt-1">Tax Invoice / Receipt</p>
        </div>

        <div className="p-5 font-mono text-sm space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="text-muted-foreground">Invoice</div>
            <div className="text-right font-semibold">{invoice_no}</div>
            <div className="text-muted-foreground">Table</div>
            <div className="text-right">{bill.table_number}</div>
            <div className="text-muted-foreground">Date</div>
            <div className="text-right">{new Date(printed_at).toLocaleString()}</div>
            <div className="text-muted-foreground">Payment</div>
            <div className="text-right">
              <Badge variant="success">{bill.payment_method?.toUpperCase()}</Badge>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-dashed border-border">
                <th className="text-left pb-1.5 font-medium">Item</th>
                <th className="text-center pb-1.5 font-medium w-8">Qty</th>
                <th className="text-right pb-1.5 font-medium">Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-dashed border-border/50">
                  <td className="py-1.5">{it.name_snapshot}</td>
                  <td className="py-1.5 text-center">{it.quantity}</td>
                  <td className="py-1.5 text-right">{formatCurrency(it.price_at_time * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (13%)</span><span>{formatCurrency(bill.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-black text-base">
              <span>TOTAL</span>
              <span className="text-primary">{formatCurrency(bill.total)}</span>
            </div>
          </div>

          <Separator />
          <p className="text-center text-xs text-muted-foreground">Thank you for dining with us! 🙏</p>
        </div>
      </div>
    </div>
  );
}
