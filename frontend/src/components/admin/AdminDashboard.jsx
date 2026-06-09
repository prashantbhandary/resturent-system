import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, TableProperties, Clock } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/utils';

const STAT_CONFIG = [
  { key: 'orders_today', label: 'Orders Today', icon: ShoppingBag, color: 'bg-blue-100 text-blue-600', format: (v) => v },
  { key: 'revenue_today', label: 'Revenue Today', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600', format: formatCurrency },
  { key: 'active_tables', label: 'Active Tables', icon: TableProperties, color: 'bg-amber-100 text-amber-600', format: (v) => v },
  { key: 'pending_orders', label: 'Pending Orders', icon: Clock, color: 'bg-red-100 text-red-600', format: (v) => v },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const { socket } = useSocket();

  const load = () => adminApi.dashboard().then(({ data }) => setStats(data.stats)).catch(() => {});

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Today's overview</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, format }) => (
          <motion.div key={key} variants={itemVariants} transition={{ duration: 0.35 }}>
            <Card className="hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                {stats ? (
                  <div className="text-3xl font-black">{format(stats[key] ?? 0)}</div>
                ) : (
                  <Skeleton className="h-9 w-20" />
                )}
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary">
        <strong>Quick links:</strong> Use the sidebar to manage your menu, tables, sales reports and staff accounts.
      </div>
    </div>
  );
}
