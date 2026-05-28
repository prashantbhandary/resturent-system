import { useEffect, useState } from 'react';
import { billingApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import BillViewer from './BillViewer.jsx';
import Receipt from './Receipt.jsx';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

export default function BillingDashboard() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { socket, connected } = useSocket();
  const { user, logout } = useAuth();

  const load = async () => {
    try {
      const { data } = await billingApi.pending();
      setBills(data.bills || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on('bill:generated', refresh);
    socket.on('bill:paid', refresh);
    return () => {
      socket.off('bill:generated', refresh);
      socket.off('bill:paid', refresh);
    };
  }, [socket]);

  const openBill = async (bill) => {
    const { data } = await billingApi.getBill(bill.id);
    setSelected(data);
  };

  const pay = async (method) => {
    if (!selected) return;
    await billingApi.pay(selected.bill.id, method);
    const { data } = await billingApi.receipt(selected.bill.id);
    setReceipt(data.receipt);
    setSelected(null);
    load();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">💳 Billing</h1>
          <div className="text-xs text-slate-500">
            {connected ? '🟢 Connected' : '🔴 Disconnected'} · {bills.length} pending bills
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm">{user.name}</span>}
          <button onClick={logout} className="btn-secondary text-sm">Logout</button>
        </div>
      </header>

      <main className="p-4 grid md:grid-cols-2 gap-4">
        <section className="card p-4">
          <h2 className="font-bold mb-3">Pending Bills</h2>
          {loading ? (
            <LoadingSpinner />
          ) : bills.length === 0 ? (
            <p className="text-slate-500">No pending bills.</p>
          ) : (
            <ul className="divide-y">
              {bills.map((b) => (
                <li key={b.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold">Table {b.table_number}</div>
                    <div className="text-xs text-slate-500">{b.items_count} items · Bill #{b.id}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-brand-600">₹{b.total.toFixed(2)}</div>
                    <button onClick={() => openBill(b)} className="btn-primary text-sm">
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4">
          {selected ? (
            <BillViewer bill={selected.bill} order={selected.order} onPay={pay} onClose={() => setSelected(null)} />
          ) : receipt ? (
            <Receipt receipt={receipt} onClose={() => setReceipt(null)} />
          ) : (
            <div className="text-slate-500 text-center py-10">
              Select a bill to view details.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
