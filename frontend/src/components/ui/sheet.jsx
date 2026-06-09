import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sheet({ open, onClose, children, side = 'right', className }) {
  const variants = {
    right: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '100%', opacity: 0 },
    },
    bottom: {
      initial: { y: '100%', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '100%', opacity: 0 },
    },
    left: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
  };

  const positionClass = {
    right: 'right-0 top-0 h-full w-full sm:max-w-md',
    bottom: 'bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh]',
    left: 'left-0 top-0 h-full w-full sm:max-w-md',
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'absolute bg-background shadow-modal flex flex-col overflow-hidden',
              positionClass[side],
              className
            )}
            variants={variants[side]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn('flex items-center justify-between px-5 py-4 border-b', className)} {...props} />;
}

export function SheetTitle({ className, ...props }) {
  return <h2 className={cn('font-semibold text-lg', className)} {...props} />;
}

export function SheetClose({ onClose }) {
  return (
    <button
      onClick={onClose}
      className="rounded-md p-1.5 hover:bg-accent transition-colors"
    >
      <X size={18} />
    </button>
  );
}

export function SheetContent({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto', className)} {...props} />;
}

export function SheetFooter({ className, ...props }) {
  return <div className={cn('border-t p-4', className)} {...props} />;
}
