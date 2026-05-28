import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

export default function SalesReport() {
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState([]);

  useEffect(() => {
    (tab === 'daily' ? adminApi.dailySales() : adminApi.weeklySales()).then(({ data }) =>
      setData(data.sales || [])
    );
  }, [tab]);

  const total = data.reduce((s, r) => s + (r.revenue || 0), 0);

  const exportCsv = () => {
    const headers = tab === 'daily' ? ['Date', 'Orders', 'Revenue'] : ['Week', 'Orders', 'Revenue'];
    const rows = data.map((r) => [
      tab === 'daily' ? r.day : r.week,
      r.orders,
      r.revenue,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Sales Report</h2>
        <button onClick={exportCsv} className="btn-secondary text-sm">Export CSV</button>
      </div>
      <div className="flex gap-2 mb-3">
        {['daily', 'weekly'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1 rounded ${tab === t ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="card p-4">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">{tab === 'daily' ? 'Date' : 'Week'}</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan="3" className="py-6 text-center text-slate-500">No paid bills yet.</td></tr>
            )}
            {data.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{tab === 'daily' ? r.day : r.week}</td>
                <td>{r.orders}</td>
                <td>₹{(r.revenue || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-2 font-bold">Total</td>
              <td></td>
              <td className="font-bold">₹{total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
