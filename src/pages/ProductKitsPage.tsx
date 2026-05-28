import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, Gift, Pencil } from 'lucide-react';

interface KitItem {
  name: string;
  item_type: string;
  purpose: string;
}

interface ProductKit {
  id: string;
  name: string;
  items: KitItem[];
  created_at: string;
  updated_at: string;
}

const emptyItem = (): KitItem => ({ name: '', item_type: '', purpose: '' });

const emptyForm = {
  name: '',
  items: [emptyItem()],
};

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-float w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto border border-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 transition-all bg-white';

function kitToForm(kit: ProductKit) {
  return {
    name: kit.name,
    items: kit.items.length > 0 ? kit.items.map((i) => ({ ...i })) : [emptyItem()],
  };
}

function normalizeItems(items: KitItem[]): KitItem[] {
  return items
    .map((i) => ({
      name: i.name.trim(),
      item_type: i.item_type.trim(),
      purpose: i.purpose.trim(),
    }))
    .filter((i) => i.name);
}

export default function ProductKitsPage() {
  const [rows, setRows] = useState<ProductKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKit, setEditingKit] = useState<ProductKit | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductKit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('product_kits').select('*').order('name', { ascending: true });
    setRows(
      ((data as ProductKit[]) ?? []).map((row) => ({
        ...row,
        items: Array.isArray(row.items) ? row.items : [],
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingKit(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (kit: ProductKit) => {
    setEditingKit(kit);
    setForm(kitToForm(kit));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingKit(null);
    setForm(emptyForm);
  };

  const updateItem = (index: number, field: keyof KitItem, value: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addItemRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItemRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? [emptyItem()] : prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const items = normalizeItems(form.items);
    if (items.length === 0) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      items,
      updated_at: new Date().toISOString(),
    };

    if (editingKit) {
      await supabase.from('product_kits').update(payload).eq('id', editingKit.id);
    } else {
      await supabase.from('product_kits').insert(payload);
    }

    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('product_kits').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  const totalItems = rows.reduce((sum, kit) => sum + kit.items.length, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg">
            🎁
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight leading-none">Product Kits</h1>
            <p className="text-[13px] text-zinc-400 mt-0.5">Internal reference — what goes into each kit we sell</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={15} /> Create Kit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Kits</p>
          <p className="text-[26px] font-bold text-zinc-900 leading-none mt-2">
            {loading ? <span className="text-zinc-300">—</span> : rows.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-4">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Products Listed</p>
          <p className="text-[26px] font-bold text-zinc-900 leading-none mt-2">
            {loading ? <span className="text-zinc-300">—</span> : totalItems}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-200 rounded-xl py-16 text-center">
          <Gift size={32} className="text-zinc-200 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-zinc-600 mb-1">No kits yet</p>
          <p className="text-[13px] text-zinc-400 mb-4">Create your first kit to track what products go in each offering.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Create Kit
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((kit) => (
            <div key={kit.id} className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-50 bg-zinc-50/50">
                <div>
                  <h2 className="text-[15px] font-semibold text-zinc-900">{kit.name}</h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{kit.items.length} items included</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(kit)}
                    className="p-2 rounded-lg hover:bg-white text-zinc-400 hover:text-indigo-600 transition-colors"
                    title="Edit kit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(kit)}
                    className="p-2 rounded-lg hover:bg-white text-zinc-400 hover:text-red-500 transition-colors"
                    title="Delete kit"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['Item', 'Type', 'Purpose'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kit.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-50 last:border-0">
                        <td className="px-4 py-2.5 text-[13px] font-medium text-zinc-900 whitespace-nowrap">
                          {item.name}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-zinc-500 whitespace-nowrap">
                          {item.item_type ? (
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700">
                              {item.item_type}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[13px] text-zinc-500">{item.purpose || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[16px] font-semibold text-zinc-900">
              {editingKit ? 'Edit Kit' : 'Create Kit'}
            </h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Field label="Kit Name" required>
              <input
                type="text"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wealth & Abundance, Couple Kit"
                required
              />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-semibold text-zinc-600">
                  Products Included <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={14} /> Add more
                </button>
              </div>

              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 border border-zinc-100 rounded-xl bg-zinc-50/50 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="Item name"
                        />
                        <input
                          type="text"
                          className={inputCls}
                          value={item.item_type}
                          onChange={(e) => updateItem(index, 'item_type', e.target.value)}
                          placeholder="Type (Bracelet, Tumble…)"
                        />
                        <input
                          type="text"
                          className={inputCls}
                          value={item.purpose}
                          onChange={(e) => updateItem(index, 'purpose', e.target.value)}
                          placeholder="Purpose (optional)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="p-2 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Add each product that goes into this kit — name, type, and purpose if relevant.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim() || normalizeItems(form.items).length === 0}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingKit ? 'Save Changes' : 'Create Kit'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-zinc-900 mb-1">Delete kit?</h3>
              <p className="text-[13px] text-zinc-400">{deleteTarget.name}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
