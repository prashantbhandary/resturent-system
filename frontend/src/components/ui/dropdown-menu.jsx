import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const DropdownContext = createContext(null);

/**
 * Minimal, accessible-enough dropdown menu (no Radix — matches this repo's
 * hand-rolled UI primitives). Closes on outside click and Escape.
 */
export function DropdownMenu({ children, align = 'end' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, align }}>
      <div className="relative" ref={ref}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, className }) {
  const { open, setOpen } = useContext(DropdownContext);
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      className={className}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, className }) {
  const { open, align } = useContext(DropdownContext);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-modal',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownMenuItem({ children, className, onSelect, ...props }) {
  const { setOpen } = useContext(DropdownContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onSelect?.(e);
        setOpen(false);
      }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }) {
  return <div className={cn('-mx-1.5 my-1.5 h-px bg-border', className)} />;
}
