import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import {
  CARD_GRADIENTS,
  getDishImage,
  getFoodEmoji,
  isVegetarian,
} from '../../lib/foodImages';

/** Small square veg / non-veg indicator (common on Indian/Nepali menus). */
function DietDot({ veg }) {
  return (
    <span
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-[4px] border bg-white/90',
        veg ? 'border-emerald-600' : 'border-red-600'
      )}
      title={veg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={cn('h-2 w-2 rounded-full', veg ? 'bg-emerald-600' : 'bg-red-600')} />
    </span>
  );
}

export default function MenuItemCard({
  item,
  categoryName,
  index = 0,
  quantity = 0,
  onAdd,
  onInc,
  onDec,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = getDishImage(item, categoryName);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  // Prefer the explicit DB flag; fall back to a name heuristic for legacy items.
  const veg = item.is_veg != null ? !!item.is_veg : isVegetarian(item.name);
  const showImage = src && !imgFailed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -3 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {showImage ? (
          <img
            src={src}
            alt={item.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br text-5xl',
              gradient
            )}
          >
            {getFoodEmoji(item.name)}
          </div>
        )}

        <div className="absolute left-2 top-2">
          <DietDot veg={veg} />
        </div>

        <div className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm backdrop-blur">
          {formatCurrency(item.price)}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold leading-snug">{item.name}</h3>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}

        {/* Add / quantity stepper */}
        <div className="mt-3 flex items-center justify-end">
          <AnimatePresence mode="wait" initial={false}>
            {quantity > 0 ? (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2.5 rounded-full bg-primary px-1.5 py-1 text-primary-foreground shadow-sm"
              >
                <button
                  onClick={onDec}
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
                  aria-label="Remove one"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-4 text-center text-sm font-bold tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={onInc}
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
                  aria-label="Add one"
                >
                  <Plus size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAdd}
                className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus size={14} /> ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
