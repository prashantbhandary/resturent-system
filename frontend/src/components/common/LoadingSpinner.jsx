import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LoadingSpinner({ label = 'Loading...', className, size = 'default' }) {
  const sizes = { sm: 16, default: 22, lg: 32 };
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground', className)}>
      <Loader2 size={sizes[size]} className="animate-spin text-primary" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
