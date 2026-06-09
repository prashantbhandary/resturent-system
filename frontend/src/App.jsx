import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ConfigProvider } from './context/ConfigContext';
import { ToastProvider } from './components/ui/toast';
import LoginPage from './pages/LoginPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import KitchenPage from './pages/KitchenPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

function Protected({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ConfigProvider>
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/menu/table/:tableId" element={<MenuPage />} />
            <Route path="/kitchen" element={<Protected roles={['admin', 'chef', 'waiter']}><KitchenPage /></Protected>} />
            <Route path="/billing" element={<Protected roles={['admin', 'billing']}><BillingPage /></Protected>} />
            <Route path="/admin/*" element={<Protected roles={['admin']}><AdminPage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
    </ConfigProvider>
  );
}
