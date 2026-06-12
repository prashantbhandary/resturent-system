import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

const ROLE_ROUTES = { admin: '/admin', chef: '/kitchen', billing: '/billing', waiter: '/kitchen' };

const QUICK_LOGINS = [
  { label: 'Admin', email: 'admin@restaurant.local', password: 'admin123', color: 'bg-violet-100 text-violet-700' },
  { label: 'Chef', email: 'chef@restaurant.local', password: 'chef123', color: 'bg-blue-100 text-blue-700' },
  { label: 'Billing', email: 'billing@restaurant.local', password: 'billing123', color: 'bg-emerald-100 text-emerald-700' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@restaurant.local');
  const [password, setPassword] = useState('admin123');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-background to-amber-50/40 p-4 dark:from-orange-950/20 dark:via-background dark:to-background">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="glow-primary inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-600 to-primary mb-4">
            <Utensils size={26} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Service starts with you — sign in</p>
        </div>

        <Card className="shadow-card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick login</CardTitle>
            <CardDescription>Select a demo account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Quick login buttons */}
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => quickLogin(q)}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-all hover:scale-105 ${q.color} ${email === q.email ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs text-muted-foreground">
                <span className="bg-background px-2">or enter manually</span>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@restaurant.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Customer?{' '}
          <Link to="/menu/table/1" className="text-primary font-medium hover:underline">
            View the menu
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
