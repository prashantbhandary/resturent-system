import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

function StatCard({ label, value, color }) {
  return (
    <div className={`card p-4 border-l-4 ${color}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const { socket } = useSocket();

  const load = () => adminApi.dashboard().then(({ data }) => setStats(data.stats));

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

  if (!stats) return <p className="text-slate-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Orders Today" value={stats.orders_today} color="border-blue-500" />
        <StatCard label="Revenue Today" value={`₹${(stats.revenue_today || 0).toFixed(2)}`} color="border-green-500" />
        <StatCard label="Active Tables" value={stats.active_tables} color="border-yellow-500" />
        <StatCard label="Pending Orders" value={stats.pending_orders} color="border-red-500" />
      </div>
    </div>
  );
}
