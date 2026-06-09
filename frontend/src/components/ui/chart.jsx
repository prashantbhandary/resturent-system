import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '../../lib/utils';

/**
 * Token-themed Recharts wrappers. Colors come from the --chart-N CSS variables,
 * so charts automatically adapt to light/dark mode with the rest of the system.
 */

const axisProps = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-modal">
      {label != null && (
        <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-popover-foreground tabular-nums">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartCard({ title, description, action, children, className }) {
  return (
    <div
      data-theme-surface
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-card',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 p-5 pb-0">
          <div>
            {title && <h3 className="font-semibold leading-none tracking-tight">{title}</h3>}
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-3 pt-4">{children}</div>
    </div>
  );
}

export function AreaTrendChart({
  data,
  xKey,
  series, // [{ key, name, color }]
  height = 260,
  valueFormatter,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient id={`fill-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip
          cursor={{ stroke: 'hsl(var(--border))' }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#fill-${s.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarTrendChart({ data, xKey, series, height = 260, valueFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
          content={<ChartTooltip valueFormatter={valueFormatter} />}
        />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export const CHART_COLORS = {
  1: 'hsl(var(--chart-1))',
  2: 'hsl(var(--chart-2))',
  3: 'hsl(var(--chart-3))',
  4: 'hsl(var(--chart-4))',
  5: 'hsl(var(--chart-5))',
};
