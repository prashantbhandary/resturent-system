import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

export default function StaffManager() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'chef' });

  const load = async () => {
    const { data } = await adminApi.listStaff();
    setUsers(data.users);
  };
  useEffect(() => { load(); }, []);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    await adminApi.createStaff(form);
    setForm({ email: '', password: '', name: '', role: 'chef' });
    load();
  };

  const toggleActive = async (u) => {
    await adminApi.updateStaff(u.id, { active: !u.active });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete user?')) return;
    await adminApi.deleteStaff(id);
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Staff</h2>
      <div className="card p-4 mb-4">
        <form onSubmit={create} className="grid md:grid-cols-5 gap-2">
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          <select className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>
            <option value="chef">Chef</option>
            <option value="billing">Billing</option>
            <option value="waiter">Waiter</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary">Add Staff</button>
        </form>
      </div>

      <div className="card p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge bg-slate-200 text-slate-700">{u.role}</span></td>
                <td>
                  <button onClick={() => toggleActive(u)} className={`badge ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="text-right">
                  <button onClick={() => remove(u.id)} className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
