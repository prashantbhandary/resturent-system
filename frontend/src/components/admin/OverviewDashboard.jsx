import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Receipt,
  ShoppingBag,
  TableProperties,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { StatCard, statGridVariants } from '../ui/stat-card';
import { AreaTrendChart, ChartCard, CHART_COLORS } from '../ui/chart';
import { DataTable } from '../ui/data-table';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../lib/utils';

const salesColumns = [
  { accessorKey: 'day', header: 'Date', cell: (c) => <span className="font-medium">{c.getValue()}</span> },
  {
    accessorKey: 'orders',
    header: 'Orders',
    meta: { align: 'center' },
    cell: (c) => <Badge variant="info">{c.getValue()}</Badge>,
  },
  {
    accessorKey: 'revenue',
    header: 'Revenue',
    meta: { align: 'right' },
    cell: (c) => (
      <span className="font-semibold text-success">{formatCurrency(c.getValue())}</span>
    ),
  },
];

export default function OverviewDashboard() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState(null);
  const { socket } = useSocket();

  const load = () => {
    adminApi.dashboard().then(({ data }) => setStats(data.stats)).catch(() => {});
    adminApi.dailySales().then(({ data }) => setSales(data.sales || [])).catch(() => setSales([]));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('order:created', refresh);
    socket.on('order:status-changed', refresh);
    socket.on('bill:paid', refresh);
    return () => {
      socket.off('order:created', refresh);
      socket.off('order:status-changed', refresh);
      socket.off('bill:paid', refresh);
    };
  }, [socket]);

  const avgTicket =
    stats && stats.orders_today > 0 ? stats.revenue_today / stats.orders_today : 0;

  const cards = [
    { key: 'revenue_today', label: 'Revenue Today', icon: DollarSign, tone: 'success', value: formatCurrency(stats?.revenue_today) },
    { key: 'orders_today', label: 'Orders Today', icon: ShoppingBag, tone: 'primary', value: stats?.orders_today ?? 0 },
    { key: 'avg_ticket', label: 'Avg. Ticket', icon: Receipt, tone: 'chart-3', value: formatCurrency(avgTicket) },
    { key: 'active_tables', label: 'Active Tables', icon: TableProperties, tone: 'warning', value: stats?.active_tables ?? 0 },
    { key: 'pending_orders', label: 'Pending Orders', icon: Clock, tone: 'destructive', value: stats?.pending_orders ?? 0 },
  ];

  // Chart wants oldest → newest; the API returns newest first.
  const chartData = useMemo(
    () =>
      (sales || [])
        .slice(0, 14)
        .map((r) => ({ day: r.day?.slice(5), revenue: r.revenue || 0, orders: r.orders || 0 }))
        .reverse(),
    [sales]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s performance and recent trends.
        </p>
      </div>

      <motion.div
        variants={statGridVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
      >
        {cards.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={c.value}
            icon={c.icon}
            tone={c.tone}
            loading={!stats}
          />
        ))}
      </motion.div>

      <ChartCard
        title="Revenue trend"
        description="Daily revenue over the last 14 days"
        action={
          <span className="hidden items-center gap-1.5 text-sm text-success sm:flex">
            <TrendingUp size={15} /> Live
          </span>
        }
      >
        {chartData.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No paid bills yet — your revenue trend will appear here.
          </div>
        ) : (
          <AreaTrendChart
            data={chartData}
            xKey="day"
            series={[{ key: 'revenue', name: 'Revenue', color: CHART_COLORS[1] }]}
            valueFormatter={formatCurrency}
          />
        )}
      </ChartCard>

      <div className="rounded-xl border border-border bg-card shadow-card" data-theme-surface>
        <div className="px-4 pt-4">
          <h3 className="font-semibold tracking-tight">Daily breakdown</h3>
          <p className="text-sm text-muted-foreground">Sortable history of paid sales.</p>
        </div>
        <DataTable
          columns={salesColumns}
          data={sales || []}
          loading={sales === null}
          searchKey="day"
          searchPlaceholder="Search by date…"
          pageSize={8}
          empty={{
            title: 'No sales yet',
            description: 'Paid bills will show up here as orders are completed.',
          }}
        />
      </div>
    </div>
  );
}
