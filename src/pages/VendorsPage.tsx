import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, Handshake, Pencil } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  vendor_type: string | null;
  gst_number: string | null;
  contact_name: string | null;
  phone_number: string | null;
  place: string | null;
  notes: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  vendor_type: '',
  gst_number: '',
  contact_name: '',
  phone_number: '',
  place: '',
  notes: '',
};

const vendorTypeStyles: Record<string, { bg: string; text: string }> = {
  packaging: { bg: 'bg-amber-50', text: 'text-amber-700' },
  products: { bg: 'bg-blue-50', text: 'text-blue-700' },
};

function vendorTypeBadge(type: string | null) {
  if (!type) return <span className="text-[12px] text-zinc-300">—</span>;
  const key = type.toLowerCase();
  const style =
    vendorTypeStyles[key] ||
    (key.includes('packaging') ? vendorTypeStyles.packaging : null) ||
    (key.includes('product') ? vendorTypeStyles.products : null) ||
    { bg: 'bg-zinc-100', text: 'text-zinc-600' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${style.bg} ${style.text}`}>
      {type}
    </span>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-float w-full sm:max-w-lg max-h-[95vh] overflow-y-auto border border-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ConfirmDelete({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-zinc-900 mb-1">Delete vendor?</h3>
          <p className="text-[13px] text-zinc-400">{label}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
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

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-50">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="px-3 py-1.5 text-[12px] font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span className="text-[12px] text-zinc-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-[12px] font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
}

function vendorToForm(vendor: Vendor) {
  return {
    name: vendor.name,
    vendor_type: vendor.vendor_type || '',
    gst_number: vendor.gst_number || '',
    contact_name: vendor.contact_name || '',
    phone_number: vendor.phone_number || '',
    place: vendor.place || '',
    notes: vendor.notes || '',
  };
}

export default function VendorsPage() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('vendors').select('*').order('name', { ascending: true });
    setRows((data as Vendor[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditingVendor(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm(vendorToForm(vendor));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      vendor_type: form.vendor_type.trim() || null,
      gst_number: form.gst_number.trim() || null,
      contact_name: form.contact_name.trim() || null,
      phone_number: form.phone_number.trim() || null,
      place: form.place.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingVendor) {
      await supabase.from('vendors').update(payload).eq('id', editingVendor.id);
    } else {
      await supabase.from('vendors').insert(payload);
      setPage(1);
    }

    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('vendors').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
          <Handshake size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight leading-none">Vendors</h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">Packaging, products, and supplier contacts</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 p-5 max-w-xs">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Vendors</p>
        <p className="text-[26px] font-bold text-zinc-900 leading-none mt-2">
          {loading ? <span className="text-zinc-300">—</span> : rows.length}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-900">Vendor Directory</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">{rows.length} vendors</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Add Vendor
          </button>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Handshake size={32} className="text-zinc-200 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-400">No vendors yet. Add your first vendor.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['Vendor Name', 'Type', 'GST Number', 'Contact', 'Phone', 'Place', 'Notes', ''].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slice.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer"
                        onClick={() => openEdit(row)}
                      >
                        <td className="px-4 py-3 text-[13px] font-medium text-zinc-900 whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{vendorTypeBadge(row.vendor_type)}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap font-mono text-[12px]">
                          {row.gst_number || '—'}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{row.contact_name || '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{row.phone_number || '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{row.place || '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 max-w-[160px] truncate">{row.notes || '—'}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(row)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-zinc-300 hover:text-indigo-600 transition-colors"
                              title="Edit vendor"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(row)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-400 transition-colors"
                              title="Delete vendor"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </>
          )}
        </div>
      </div>

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[16px] font-semibold text-zinc-900">
              {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
            </h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Vendor Name" required>
              <input
                type="text"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Crystal Wholesaler Ltd."
                required
              />
            </Field>
            <Field label="Vendor Type">
              <input
                type="text"
                className={inputCls}
                value={form.vendor_type}
                onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}
                placeholder="e.g. Packaging, Products, Crystals"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5">
                What does this vendor supply?
              </p>
            </Field>
            <Field label="GST Number">
              <input
                type="text"
                className={inputCls}
                value={form.gst_number}
                onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                placeholder="e.g. 29ABCDE1234F1Z5"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <input
                  type="text"
                  className={inputCls}
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="Person to reach"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  type="tel"
                  className={inputCls}
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>
            <Field label="Place">
              <input
                type="text"
                className={inputCls}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                placeholder="City, state, or address"
              />
            </Field>
            <Field label="Notes">
              <textarea
                className={inputCls + ' resize-none'}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment terms, specialties, etc."
              />
            </Field>
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
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingVendor ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDelete
          label={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
