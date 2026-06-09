import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { formatCurrency } from '../../lib/utils';

export default function SalesReport() {
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (tab === 'daily' ? adminApi.dailySales() : adminApi.weeklySales())
      .then(({ data: d }) => setData(d.sales || []))
      .finally(() => setLoading(false));
  }, [tab]);

  const total = data.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalOrders = data.reduce((s, r) => s + (r.orders || 0), 0);

  const exportCsv = () => {
    const headers = [tab === 'daily' ? 'Date' : 'Week', 'Orders', 'Revenue'];
    const rows = data.map((r) => [tab === 'daily' ? r.day : r.week, r.orders, r.revenue]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sales-${tab}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Sales Report</h1><p className="text-sm text-muted-foreground mt-0.5">Revenue and order trends</p></div>
        <Button variant="outline" onClick={exportCsv} className="gap-2"><Download size={16} /> Export CSV</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <div className="text-3xl font-black text-emerald-600">{formatCurrency(total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Orders</span>
            </div>
            <div className="text-3xl font-black text-blue-600">{totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab + table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Breakdown</CardTitle>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {['daily', 'weekly'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-xs font-medium transition-colors ${tab === t ? 'bg-primary text-white' : 'hover:bg-secondary text-muted-foreground'}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No paid bills yet — sales data will appear here.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left px-5 py-3 font-medium">{tab === 'daily' ? 'Date' : 'Week'}</th>
                    <th className="text-center px-3 py-3 font-medium">Orders</th>
                    <th className="text-right px-5 py-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((r, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-secondary/40">
                      <td className="px-5 py-3 font-medium">{tab === 'daily' ? r.day : r.week}</td>
                      <td className="px-3 py-3 text-center"><Badge variant="info">{r.orders}</Badge></td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatCurrency(r.revenue)}</td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-secondary/30">
                  <tr>
                    <td className="px-5 py-3 font-bold">Total</td>
                    <td className="px-3 py-3 text-center font-bold">{totalOrders}</td>
                    <td className="px-5 py-3 text-right font-black text-emerald-600">{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
