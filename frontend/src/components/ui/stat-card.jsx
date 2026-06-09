import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from './card';
import { Skeleton } from './skeleton';
import { cn } from '../../lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Summary stat card for dashboard overviews.
 *
 * Props:
 *  - label, value (already-formatted string/number), icon
 *  - loading: shows a skeleton
 *  - delta: { value: '+12%', trend: 'up' | 'down' } optional trend chip
 *  - tone: token-based accent ('primary' | 'success' | 'warning' | 'destructive' | 'chart-2'...)
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  loading = false,
  delta,
  tone = 'primary',
  className,
}) {
  const trendUp = delta?.trend !== 'down';
  return (
    <motion.div variants={itemVariants} transition={{ duration: 0.35 }}>
      <Card
        data-theme-surface
        className={cn('hover:shadow-card-hover transition-shadow', className)}
      >
        <CardContent className="pt-5">
          <div className="flex items-start justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `hsl(var(--${tone}) / 0.12)`,
                color: `hsl(var(--${tone}))`,
              }}
            >
              {Icon ? <Icon size={20} /> : null}
            </div>
            {delta ? (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  trendUp
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {delta.value}
              </span>
            ) : null}
          </div>

          {loading ? (
            <Skeleton className="mt-3 h-9 w-24" />
          ) : (
            <div className="mt-3 text-3xl font-black tracking-tight tabular-nums">
              {value}
            </div>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const statGridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
