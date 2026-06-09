import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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

function ItemDialog({ open, onClose, onSave, categories, initial }) {
  const [form, setForm] = useState(initial || { category_id: '', name: '', description: '', price: '', available: true });
  useEffect(() => { setForm(initial || { category_id: categories[0]?.id || '', name: '', description: '', price: '', available: true }); }, [initial, open]);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { if (!form.name || !form.price) return; onSave({ ...form, price: parseFloat(form.price) }); };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div><Label>Category</Label>
            <Select className="mt-1" value={form.category_id} onChange={(e) => update('category_id', parseInt(e.target.value, 10))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
          </div>
          <div><Label>Name</Label><Input className="mt-1" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Butter Chicken" /></div>
          <div><Label>Description</Label><Input className="mt-1" value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Brief description…" /></div>
          <div><Label>Price (₹)</Label><Input className="mt-1" type="number" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="280" /></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => update('available', !form.available)} className={`text-2xl transition-colors ${form.available ? 'text-emerald-500' : 'text-slate-300'}`}>
              {form.available ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
            <Label>Available</Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{initial ? 'Save Changes' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: '' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [c, i] = await Promise.all([adminApi.listCategories(), adminApi.listItems()]);
    setCategories(c.data.categories);
    setItems(i.data.items);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addItem = async (form) => {
    try {
      await adminApi.createItem(form);
      setAddOpen(false); load();
      toast({ title: 'Item added', variant: 'success' });
    } catch { toast({ title: 'Failed to add item', variant: 'error' }); }
  };

  const saveItem = async (form) => {
    try {
      await adminApi.updateItem(editItem.id, form);
      setEditItem(null); load();
      toast({ title: 'Item updated', variant: 'success' });
    } catch { toast({ title: 'Failed to update', variant: 'error' }); }
  };

  const removeItem = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await adminApi.deleteItem(id);
    load();
    toast({ title: 'Item deleted' });
  };

  const toggleAvail = async (item) => {
    await adminApi.updateItem(item.id, { available: !item.available });
    load();
  };

  const addCat = async () => {
    if (!newCat.name) return;
    await adminApi.createCategory(newCat);
    setNewCat({ name: '', icon: '' }); load();
    toast({ title: 'Category added', variant: 'success' });
  };

  const removeCat = async (id) => {
    if (!confirm('Delete category and all its items?')) return;
    await adminApi.deleteCategory(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Menu</h1><p className="text-sm text-muted-foreground mt-0.5">Manage categories and dishes</p></div>
        <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus size={16} /> Add Item</Button>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Category name" value={newCat.name} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))} className="max-w-xs" />
            <Input placeholder="Icon (emoji)" value={newCat.icon} onChange={(e) => setNewCat((p) => ({ ...p, icon: e.target.value }))} className="w-28" />
            <Button onClick={addCat} size="sm" variant="outline" className="gap-1.5"><Plus size={14} /> Add</Button>
          </div>
          {loading ? <Skeleton className="h-8 w-full" /> : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1 text-sm">
                  {c.icon} {c.name}
                  <button onClick={() => removeCat(c.id)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Items ({items.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground text-xs">
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Category</th>
                    <th className="text-left px-3 py-3 font-medium">Price</th>
                    <th className="text-center px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((it) => {
                    const cat = categories.find((c) => c.id === it.category_id);
                    return (
                      <motion.tr key={it.id} layout className="hover:bg-secondary/40 transition-colors">
                        <td className="px-5 py-3 font-medium">{it.name}</td>
                        <td className="px-3 py-3 text-muted-foreground hidden sm:table-cell">{cat?.icon} {cat?.name}</td>
                        <td className="px-3 py-3 font-semibold text-primary">₹{it.price}</td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => toggleAvail(it)}>
                            <Badge variant={it.available ? 'success' : 'secondary'}>
                              {it.available ? 'Available' : 'Hidden'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setEditItem(it)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => removeItem(it.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ItemDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={addItem} categories={categories} initial={null} />
      <ItemDialog open={!!editItem} onClose={() => setEditItem(null)} onSave={saveItem} categories={categories} initial={editItem} />
    </div>
  );
}
