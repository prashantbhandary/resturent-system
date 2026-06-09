import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wifi, WifiOff, LogOut, Receipt, Clock, RefreshCw } from 'lucide-react';
import { billingApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/toast';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import BillViewer from './BillViewer.jsx';
import ReceiptView from './Receipt.jsx';
import { formatCurrency, timeAgo } from '../../lib/utils';

function BillRow({ bill, active, onClick }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
        active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:bg-secondary/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold">Table {bill.table_number}</span>
            <Badge variant="warning" className="text-[10px]">Pending</Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Receipt size={11} /> Bill #{bill.id}
            <span>·</span>
            <Clock size={11} /> {timeAgo(bill.created_at)}
            <span>·</span>
            {bill.items_count} items
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-primary text-lg">{formatCurrency(bill.total)}</span>
        </div>
      </div>
    </motion.button>
  );
}

export default function BillingDashboard() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { socket, connected } = useSocket();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const load = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await billingApi.pending();
      setBills(data.bills || []);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load(true);
    socket.on('bill:generated', refresh);
    socket.on('bill:paid', refresh);
    return () => {
      socket.off('bill:generated', refresh);
      socket.off('bill:paid', refresh);
    };
  }, [socket]);

  const openBill = async (bill) => {
    try {
      const { data } = await billingApi.getBill(bill.id);
      setSelected(data);
      setReceipt(null);
    } catch {
      toast({ title: 'Failed to load bill', variant: 'error' });
    }
  };

  const pay = async (method) => {
    if (!selected) return;
    try {
      await billingApi.pay(selected.bill.id, method);
      const { data } = await billingApi.receipt(selected.bill.id);
      setReceipt(data.receipt);
      setSelected(null);
      load(true);
      toast({ title: 'Payment recorded', description: `Paid via ${method}`, variant: 'success' });
    } catch {
      toast({ title: 'Payment failed', variant: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CreditCard size={18} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="font-bold leading-none">Billing</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {connected
                ? <><Wifi size={11} className="text-emerald-500" /><span className="text-xs text-emerald-600">Live</span></>
                : <><WifiOff size={11} className="text-red-500" /><span className="text-xs text-red-500">Offline</span></>
              }
              <span className="text-xs text-muted-foreground">· {bills.length} pending</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} disabled={refreshing} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-5 gap-0">
        {/* Left: Bills list */}
        <div className="md:col-span-2 border-r border-border p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pending Bills</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CreditCard size={36} strokeWidth={1.5} className="mb-3" />
              <p className="text-sm">No pending bills</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {bills.map((b) => (
                  <BillRow
                    key={b.id}
                    bill={b}
                    active={selected?.bill?.id === b.id}
                    onClick={() => openBill(b)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Bill details / Receipt */}
        <div className="md:col-span-3 p-5 overflow-y-auto">
          <AnimatePresence mode="wait">
            {receipt ? (
              <motion.div key="receipt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ReceiptView receipt={receipt} onClose={() => setReceipt(null)} />
              </motion.div>
            ) : selected ? (
              <motion.div key="viewer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <BillViewer bill={selected.bill} order={selected.order} onPay={pay} onClose={() => setSelected(null)} />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Receipt size={40} strokeWidth={1.5} className="mb-3" />
                <p className="text-sm">Select a bill to process payment</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
