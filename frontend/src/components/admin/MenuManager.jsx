import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';

function CategoryForm({ onCreated }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!name) return;
    await adminApi.createCategory({ name, icon });
    setName(''); setIcon('');
    onCreated();
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input className="input" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input w-24" placeholder="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
      <button className="btn-primary">Add</button>
    </form>
  );
}

function ItemForm({ categories, onCreated, editItem, onCancel }) {
  const [form, setForm] = useState(
    editItem || { category_id: categories[0]?.id || '', name: '', description: '', price: '', available: true }
  );
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price) };
    if (editItem) await adminApi.updateItem(editItem.id, payload);
    else await adminApi.createItem(payload);
    onCreated();
  };
  return (
    <form onSubmit={submit} className="grid md:grid-cols-5 gap-2">
      <select className="input" value={form.category_id} onChange={(e) => update('category_id', parseInt(e.target.value, 10))}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input className="input" placeholder="Name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
      <input className="input" placeholder="Description" value={form.description || ''} onChange={(e) => update('description', e.target.value)} />
      <input className="input" placeholder="Price" type="number" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} required />
      <div className="flex gap-2">
        <button className="btn-primary flex-1">{editItem ? 'Save' : 'Add'}</button>
        {editItem && <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>}
      </div>
    </form>
  );
}

export default function MenuManager() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [editItem, setEditItem] = useState(null);

  const load = async () => {
    const [c, i] = await Promise.all([adminApi.listCategories(), adminApi.listItems()]);
    setCategories(c.data.categories);
    setItems(i.data.items);
  };

  useEffect(() => { load(); }, []);

  const removeItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    await adminApi.deleteItem(id);
    load();
  };

  const toggleAvail = async (item) => {
    await adminApi.updateItem(item.id, { available: !item.available });
    load();
  };

  const removeCat = async (id) => {
    if (!confirm('Delete this category and all its items?')) return;
    await adminApi.deleteCategory(id);
    load();
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-bold mb-2">Categories</h2>
        <div className="card p-4 space-y-3">
          <CategoryForm onCreated={load} />
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="py-2 flex justify-between items-center">
                <span>{c.icon} {c.name}</span>
                <button onClick={() => removeCat(c.id)} className="text-red-500 text-sm">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-2">Items</h2>
        <div className="card p-4 space-y-3">
          <ItemForm
            categories={categories}
            onCreated={() => { setEditItem(null); load(); }}
            editItem={editItem}
            onCancel={() => setEditItem(null)}
          />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Available</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const cat = categories.find((c) => c.id === it.category_id);
                return (
                  <tr key={it.id} className="border-b">
                    <td className="py-2">{it.name}</td>
                    <td>{cat?.name || '—'}</td>
                    <td>₹{it.price}</td>
                    <td>
                      <button
                        onClick={() => toggleAvail(it)}
                        className={`badge ${it.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {it.available ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="space-x-2 text-right">
                      <button onClick={() => setEditItem(it)} className="text-brand-600">Edit</button>
                      <button onClick={() => removeItem(it.id)} className="text-red-500">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
