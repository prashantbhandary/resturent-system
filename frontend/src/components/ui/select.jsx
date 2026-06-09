import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-9 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}
