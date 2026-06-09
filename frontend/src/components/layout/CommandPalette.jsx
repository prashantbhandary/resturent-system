import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * ⌘K / Ctrl-K command palette for keyboard-driven navigation.
 *
 * Props:
 *  - open, setOpen
 *  - items: [{ label, to, icon, group, keywords?, onSelect? }]
 */
export function CommandPalette({ open, setOpen, items = [] }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  // Global ⌘K / Ctrl-K shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.label, it.group, ...(it.keywords || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query, items]);

  const run = (item) => {
    setOpen(false);
    if (item.onSelect) item.onSelect();
    else if (item.to) navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && filtered[active]) {
      e.preventDefault();
      run(filtered[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-modal"
            initial={{ scale: 0.97, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search size={17} className="text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search pages and actions…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results for “{query}”.
                </p>
              ) : (
                filtered.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => run(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        i === active ? 'bg-accent text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {Icon ? <Icon size={16} className="shrink-0" /> : null}
                      <span className="flex-1 text-foreground">{item.label}</span>
                      {item.group && (
                        <span className="text-xs text-muted-foreground">{item.group}</span>
                      )}
                      {i === active && (
                        <CornerDownLeft size={13} className="text-muted-foreground" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
