import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [qr, setQr] = useState(null);

  const load = async () => {
    const { data } = await adminApi.listTables();
    setTables(data.tables);
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!number) return;
    await adminApi.createTable({ table_number: parseInt(number, 10), capacity });
    setNumber(''); setCapacity(4);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete table?')) return;
    await adminApi.deleteTable(id);
    load();
  };

  const showQr = async (table) => {
    const origin = window.location.origin;
    const { data } = await adminApi.qrCode(table.id, origin);
    setQr({ ...data, table });
  };

  const downloadQr = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr.qr_code;
    a.download = `table-${qr.table.table_number}-qr.png`;
    a.click();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Tables</h2>
      <div className="card p-4 space-y-3 mb-4">
        <form onSubmit={create} className="flex gap-2 items-end">
          <div>
            <label className="text-xs">Table #</label>
            <input className="input" type="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs">Capacity</label>
            <input className="input w-24" type="number" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 4)} />
          </div>
          <button className="btn-primary">Add Table</button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tables.map((t) => (
          <div key={t.id} className="card p-4 text-center">
            <div className="text-2xl font-bold">T{t.table_number}</div>
            <div className="text-xs text-slate-500">Capacity: {t.capacity}</div>
            <div className="flex gap-1 mt-2">
              <button onClick={() => showQr(t)} className="btn-primary flex-1 text-xs">QR</button>
              <button onClick={() => remove(t.id)} className="btn-danger text-xs">Del</button>
            </div>
          </div>
        ))}
      </div>

      {qr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl text-center max-w-sm">
            <h3 className="font-bold text-lg mb-2">Table {qr.table.table_number} QR Code</h3>
            <img src={qr.qr_code} alt="QR" className="mx-auto" />
            <p className="text-xs text-slate-500 mt-2 break-all">{qr.url}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={downloadQr} className="btn-primary flex-1">Download</button>
              <button onClick={() => setQr(null)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
