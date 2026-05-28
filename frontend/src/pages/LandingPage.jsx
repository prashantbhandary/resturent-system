import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-slate-800">🍽️ Restaurant Order System</h1>
        <p className="text-slate-600">QR-based ordering with real-time kitchen and billing.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link to="/menu/table/1" className="card p-4 hover:shadow-md text-left">
            <div className="text-2xl">📱</div>
            <div className="font-semibold">Customer Menu</div>
            <div className="text-sm text-slate-500">Demo: Table 1</div>
          </Link>
          <Link to="/login" className="card p-4 hover:shadow-md text-left">
            <div className="text-2xl">🔐</div>
            <div className="font-semibold">Staff Login</div>
            <div className="text-sm text-slate-500">Kitchen / Billing / Admin</div>
          </Link>
        </div>
        <div className="text-xs text-slate-500">
          <p>Demo accounts after running <code>npm run seed</code>:</p>
          <p>admin@restaurant.local / admin123</p>
          <p>chef@restaurant.local / chef123</p>
          <p>billing@restaurant.local / billing123</p>
        </div>
      </div>
    </div>
  );
}
