import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/admin/AdminDashboard.jsx';
import MenuManager from '../components/admin/MenuManager.jsx';
import TableManager from '../components/admin/TableManager.jsx';
import SalesReport from '../components/admin/SalesReport.jsx';
import StaffManager from '../components/admin/StaffManager.jsx';

export default function AdminPage() {
  const { user, logout } = useAuth();

  const links = [
    { to: '', label: '📊 Dashboard', end: true },
    { to: 'menu', label: '🍔 Menu' },
    { to: 'tables', label: '🪑 Tables' },
    { to: 'sales', label: '📈 Sales' },
    { to: 'staff', label: '👥 Staff' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 bg-slate-900 text-white p-4">
        <h1 className="text-xl font-bold mb-1">🛠️ Admin</h1>
        <p className="text-xs text-slate-400 mb-6">{user?.name}</p>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive ? 'bg-brand-600' : 'hover:bg-slate-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="btn-secondary mt-6 w-full text-sm">Logout</button>
      </aside>
      <main className="flex-1 p-4 md:p-6 bg-slate-50">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="tables" element={<TableManager />} />
          <Route path="sales" element={<SalesReport />} />
          <Route path="staff" element={<StaffManager />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </main>
    </div>
  );
}
