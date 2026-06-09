import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

let id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const toastId = ++id;
    setToasts((p) => [...p, { id: toastId, title, description, variant }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== toastId)), duration);
  }, []);

  const dismiss = useCallback((toastId) => {
    setToasts((p) => p.filter((t) => t.id !== toastId));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-modal bg-background',
                t.variant === 'success' && 'border-emerald-200 bg-emerald-50',
                t.variant === 'error' && 'border-red-200 bg-red-50',
                t.variant === 'warning' && 'border-amber-200 bg-amber-50',
              )}
            >
              {t.variant === 'success' && <CheckCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />}
              {t.variant === 'error' && <XCircle size={18} className="text-red-600 mt-0.5 shrink-0" />}
              {t.variant === 'warning' && <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold">{t.title}</p>}
                {t.description && <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded p-0.5 hover:bg-black/10 transition-colors shrink-0">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
