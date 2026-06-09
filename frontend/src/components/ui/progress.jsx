import { cn } from '../../lib/utils';

export function Progress({ value = 0, className, indicatorClassName, ...props }) {
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <div
        className={cn('h-full bg-primary transition-all duration-500 ease-out', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
