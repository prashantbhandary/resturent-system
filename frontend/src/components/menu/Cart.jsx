import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Sheet, SheetHeader, SheetTitle, SheetClose, SheetContent, SheetFooter } from '../ui/sheet';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { formatCurrency } from '../../lib/utils';
import { getDishImage, getFoodEmoji } from '../../lib/foodImages';

function CartThumb({ name }) {
  const src = getDishImage({ name });
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 text-lg dark:from-orange-950/40 dark:to-amber-950/20">
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.replaceWith(
              Object.assign(document.createElement('span'), {
                textContent: getFoodEmoji(name),
              })
            );
          }}
        />
      ) : (
        <span>{getFoodEmoji(name)}</span>
      )}
    </div>
  );
}

export default function Cart({ open, onClose, onSubmit }) {
  const { items, setQuantity, remove, subtotal, clear } = useCart();

  return (
    <Sheet open={open} onClose={onClose} side="bottom">
      <SheetHeader>
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} />
          <SheetTitle>Your Cart</SheetTitle>
          {items.length > 0 && (
            <span className="ml-1 rounded-full bg-primary text-white text-xs font-bold px-2 py-0.5">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        <SheetClose onClose={onClose} />
      </SheetHeader>

      <SheetContent className="px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <motion.ul layout className="space-y-3">
            {items.map((it) => (
              <motion.li
                key={it.item_id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/60"
              >
                <CartThumb name={it.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(it.price)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQuantity(it.item_id, it.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                  <button
                    onClick={() => setQuantity(it.item_id, it.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-right min-w-[52px]">
                  <p className="text-sm font-semibold">{formatCurrency(it.price * it.quantity)}</p>
                </div>
                <button onClick={() => remove(it.item_id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={15} />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </SheetContent>

      {items.length > 0 && (
        <SheetFooter className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (13%)</span>
              <span>{formatCurrency(subtotal * 0.13)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total (est.)</span>
              <span className="text-primary">{formatCurrency(subtotal * 1.13)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clear} className="flex-1">Clear</Button>
            <Button onClick={onSubmit} className="flex-2 flex-1 shadow-lg shadow-primary/20">
              Place Order
            </Button>
          </div>
        </SheetFooter>
      )}
    </Sheet>
  );
}
