import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

/**
 * Single-button light/dark toggle with an animated icon swap.
 * (Falls back to resolving 'system' to its current value.)
 */
export function ThemeToggle({ className }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground',
        'hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <motion.span
        key={isDark ? 'moon' : 'sun'}
        initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? <Moon size={18} /> : <Sun size={18} />}
      </motion.span>
    </button>
  );
}
