import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_ROUTES = {
  admin: '/admin',
  chef: '/kitchen',
  billing: '/billing',
  waiter: '/kitchen',
};

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@restaurant.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6 space-y-4">
        <div className="text-center">
          <div className="text-3xl">🔐</div>
          <h1 className="text-2xl font-bold">Staff Login</h1>
        </div>
        {error && (
          <div className="rounded bg-red-50 text-red-700 text-sm p-3">{error}</div>
        )}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-xs text-slate-500 text-center">
          Try admin/chef/billing demo accounts (see README).
        </p>
      </form>
    </div>
  );
}
