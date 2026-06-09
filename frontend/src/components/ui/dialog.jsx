import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-lg"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function DialogContent({ className, onClose, children, ...props }) {
  return (
    <div
      className={cn('bg-background rounded-2xl shadow-modal border border-border overflow-hidden', className)}
      {...props}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 hover:bg-accent transition-colors"
        >
          <X size={18} />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('px-6 pt-6 pb-4', className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props} />;
}

export function DialogBody({ className, ...props }) {
  return <div className={cn('px-6 pb-4', className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('flex justify-end gap-3 px-6 py-4 border-t bg-muted/30', className)} {...props} />;
}
