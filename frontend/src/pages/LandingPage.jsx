import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ChefHat, CreditCard, LayoutDashboard, ArrowRight, Utensils } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const features = [
  { icon: QrCode, title: 'QR Ordering', desc: 'Customers scan & order directly from their phone', color: 'bg-orange-100 text-orange-600' },
  { icon: ChefHat, title: 'Kitchen Display', desc: 'Real-time order tracking for kitchen staff', color: 'bg-blue-100 text-blue-600' },
  { icon: CreditCard, title: 'Smart Billing', desc: 'One-click bill generation and payment', color: 'bg-emerald-100 text-emerald-600' },
  { icon: LayoutDashboard, title: 'Admin Dashboard', desc: 'Manage menu, tables, staff and sales', color: 'bg-purple-100 text-purple-600' },
];

const portals = [
  { icon: QrCode, label: 'Customer Menu', sub: 'Demo — Table 1', to: '/menu/table/1', color: 'from-orange-500 to-amber-500' },
  { icon: ChefHat, label: 'Kitchen Display', sub: 'Login as Chef', to: '/login', color: 'from-blue-500 to-cyan-500' },
  { icon: CreditCard, label: 'Billing', sub: 'Login as Billing', to: '/login', color: 'from-emerald-500 to-teal-500' },
  { icon: LayoutDashboard, label: 'Admin Panel', sub: 'Login as Admin', to: '/login', color: 'from-violet-500 to-purple-500' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Utensils size={16} className="text-white" />
            </div>
            DineQR
          </div>
          <Link to="/login">
            <Button size="sm">Staff Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Live Demo Running
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance mb-4">
            Restaurant QR Ordering
            <span className="text-primary"> System</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-balance">
            Customers order from their phones. Kitchen gets real-time updates. Billing is instant. All in one system.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/menu/table/1">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                Try Customer Menu <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">Staff Login</Button>
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={itemVariants}>
              <Card className="h-full hover:shadow-card-hover transition-shadow duration-200">
                <CardContent className="pt-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Portals */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-center text-xl font-bold mb-6">Open a Portal</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {portals.map((p) => (
              <Link key={p.label} to={p.to}>
                <div className="group relative overflow-hidden rounded-2xl cursor-pointer">
                  <div className={`bg-gradient-to-br ${p.color} p-5 text-white`}>
                    <p.icon size={28} className="mb-3 opacity-90" />
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-xs opacity-75 mt-0.5">{p.sub}</div>
                    <ArrowRight size={14} className="mt-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Demo Creds */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground">
            Demo accounts — <span className="font-mono">admin@restaurant.local / admin123</span> &nbsp;·&nbsp;
            <span className="font-mono">chef@restaurant.local / chef123</span> &nbsp;·&nbsp;
            <span className="font-mono">billing@restaurant.local / billing123</span>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
