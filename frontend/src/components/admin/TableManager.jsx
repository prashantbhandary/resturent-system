import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, QrCode, Download, X } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../ui/toast';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ table_number: '', capacity: 4 });
  const [qr, setQr] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await adminApi.listTables();
    setTables(data.tables);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.table_number) return;
    try {
      await adminApi.createTable({ table_number: parseInt(form.table_number, 10), capacity: form.capacity });
      setForm({ table_number: '', capacity: 4 });
      load();
      toast({ title: `Table ${form.table_number} added`, variant: 'success' });
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Failed to add table', variant: 'error' });
    }
  };

  const remove = async (id, num) => {
    if (!confirm(`Delete Table ${num}?`)) return;
    await adminApi.deleteTable(id);
    load();
    toast({ title: `Table ${num} deleted` });
  };

  const showQr = async (table) => {
    const origin = window.location.origin;
    const { data } = await adminApi.qrCode(table.id, origin);
    setQr({ ...data, table });
  };

  const downloadQr = () => {
    const a = document.createElement('a');
    a.href = qr.qr_code;
    a.download = `table-${qr.table.table_number}-qr.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tables & QR Codes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add tables and generate QR codes for customers</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form onSubmit={create} className="flex flex-wrap items-end gap-3">
            <div><Label>Table Number</Label><Input className="mt-1 w-32" type="number" min="1" value={form.table_number} onChange={(e) => setForm((p) => ({ ...p, table_number: e.target.value }))} placeholder="7" /></div>
            <div><Label>Capacity</Label><Input className="mt-1 w-24" type="number" min="1" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value, 10) || 4 }))} /></div>
            <Button type="submit" className="gap-2"><Plus size={16} /> Add Table</Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {tables.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="text-3xl font-black text-center text-primary mb-1">T{t.table_number}</div>
                <div className="text-center text-xs text-muted-foreground mb-3">{t.capacity} seats</div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => showQr(t)} className="flex-1 gap-1 text-xs"><QrCode size={13} /> QR</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(t.id, t.table_number)} className="text-destructive hover:bg-destructive/10 border-destructive/30">
                    <Trash2 size={13} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* QR Modal */}
      <AnimatePresence>
        {qr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQr(null)} />
            <motion.div
              className="relative bg-background rounded-2xl shadow-modal p-6 max-w-sm w-full text-center"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            >
              <button onClick={() => setQr(null)} className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X size={16} /></button>
              <Badge variant="info" className="mb-3">Table {qr.table.table_number}</Badge>
              <img src={qr.qr_code} alt="QR Code" className="mx-auto w-48 h-48 rounded-xl" />
              <p className="text-xs text-muted-foreground mt-3 break-all font-mono">{qr.url}</p>
              <Button onClick={downloadQr} className="mt-4 gap-2 w-full"><Download size={16} /> Download PNG</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
