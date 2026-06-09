import { Routes, Route, Navigate } from 'react-router-dom';
import {
  BarChart3,
  LayoutDashboard,
  QrCode,
  Users,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import OverviewDashboard from '../components/admin/OverviewDashboard.jsx';
import MenuManager from '../components/admin/MenuManager.jsx';
import TableManager from '../components/admin/TableManager.jsx';
import SalesReport from '../components/admin/SalesReport.jsx';
import StaffManager from '../components/admin/StaffManager.jsx';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '', end: true, icon: LayoutDashboard, label: 'Dashboard', keywords: ['home', 'overview', 'stats'] },
      { to: 'sales', icon: BarChart3, label: 'Sales', keywords: ['revenue', 'reports', 'analytics'] },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: 'menu', icon: UtensilsCrossed, label: 'Menu', keywords: ['items', 'categories', 'food', 'prices'] },
      { to: 'tables', icon: QrCode, label: 'Tables & QR', keywords: ['qr', 'seats', 'codes'] },
      { to: 'staff', icon: Users, label: 'Staff', keywords: ['users', 'roles', 'accounts'] },
    ],
  },
];

export default function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <AppShell
      brand={{ name: 'DineQR', tagline: 'Admin Panel', icon: Utensils }}
      basePath="/admin"
      groups={NAV_GROUPS}
      user={user}
      onLogout={logout}
    >
      <Routes>
        <Route index element={<OverviewDashboard />} />
        <Route path="menu" element={<MenuManager />} />
        <Route path="tables" element={<TableManager />} />
        <Route path="sales" element={<SalesReport />} />
        <Route path="staff" element={<StaffManager />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </AppShell>
  );
}
