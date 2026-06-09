import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';

const ROLE_COLORS = { admin: 'info', chef: 'warning', billing: 'success', waiter: 'pending' };

function AddStaffDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'chef' });
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { if (!form.email || !form.password || !form.name) return; onSave(form); };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
        <DialogBody className="space-y-3">
          <div><Label>Full Name</Label><Input className="mt-1" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Doe" /></div>
          <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@restaurant.com" /></div>
          <div><Label>Password</Label><Input className="mt-1" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Min. 6 characters" /></div>
          <div><Label>Role</Label>
            <Select className="mt-1" value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="chef">Chef</option>
              <option value="billing">Billing</option>
              <option value="waiter">Waiter</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Add Staff</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await adminApi.listStaff();
    setUsers(data.users);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addStaff = async (form) => {
    try {
      await adminApi.createStaff(form);
      setAddOpen(false); load();
      toast({ title: 'Staff member added', variant: 'success' });
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Failed to add staff', variant: 'error' });
    }
  };

  const toggleActive = async (u) => {
    await adminApi.updateStaff(u.id, { active: !u.active });
    load();
    toast({ title: u.active ? `${u.name} deactivated` : `${u.name} activated` });
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name}?`)) return;
    await adminApi.deleteStaff(u.id);
    load();
    toast({ title: `${u.name} removed` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Staff</h1><p className="text-sm text-muted-foreground mt-0.5">Manage team members and roles</p></div>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus size={16} /> Add Staff</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Team Members ({users.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <motion.div key={u.id} layout className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/40 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant={ROLE_COLORS[u.role] || 'secondary'} className="hidden sm:inline-flex">{u.role}</Badge>
                  <Badge variant={u.active ? 'success' : 'secondary'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(u)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title={u.active ? 'Deactivate' : 'Activate'}
                    >
                      {u.active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button onClick={() => remove(u)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddStaffDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={addStaff} />
    </div>
  );
}
