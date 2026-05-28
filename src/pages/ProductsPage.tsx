import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Trash2,
  X,
  ShoppingBag,
  Pencil,
  ArrowLeft,
  Save,
  Table2,
  Handshake,
} from 'lucide-react';

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

interface VendorProduct {
  id: string;
  vendor_id: string;
  name: string;
  sku: string | null;
  qty: number | null;
  price: number | null;
  created_at: string;
  updated_at: string;
}

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  qty: string;
  price: string;
  isNew?: boolean;
};

const emptyVendorForm = {
  name: '',
  vendor_type: 'Products',
  gst_number: '',
  contact_name: '',
  phone_number: '',
  place: '',
  notes: '',
};

const emptyProductRow = (): ProductRow => ({
  id: `new-${crypto.randomUUID()}`,
  name: '',
  sku: '',
  qty: '',
  price: '',
  isNew: true,
});

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

const cellCls =
  'w-full px-2.5 py-2 text-[13px] border border-transparent rounded-lg focus:outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-100 bg-transparent hover:bg-zinc-50/80 transition-all';

function productToRow(p: VendorProduct): ProductRow {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    qty: p.qty != null ? String(p.qty) : '',
    price: p.price != null ? String(p.price) : '',
  };
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function formatCurrency(value: number | null) {
  if (value == null) return '—';
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function ProductsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [savingVendor, setSavingVendor] = useState(false);

  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    const { data: vendorData } = await supabase.from('vendors').select('*').order('name', { ascending: true });
    const list = (vendorData as Vendor[]) ?? [];
    setVendors(list);

    const { data: countData } = await supabase.from('vendor_products').select('vendor_id');
    const counts: Record<string, number> = {};
    for (const row of countData ?? []) {
      const id = (row as { vendor_id: string }).vendor_id;
      counts[id] = (counts[id] || 0) + 1;
    }
    setProductCounts(counts);
    setLoading(false);
  }, []);

  const loadProducts = useCallback(async (vendorId: string) => {
    setLoadingProducts(true);
    const { data } = await supabase
      .from('vendor_products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('name', { ascending: true });

    const rows = ((data as VendorProduct[]) ?? []).map(productToRow);
    setProductRows(rows.length > 0 ? rows : [emptyProductRow()]);
    setRemovedIds([]);
    setDirty(false);
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    if (selectedVendor) {
      loadProducts(selectedVendor.id);
    }
  }, [selectedVendor, loadProducts]);

  const openVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const backToVendors = () => {
    setSelectedVendor(null);
    setProductRows([]);
    setRemovedIds([]);
    setDirty(false);
    loadVendors();
  };

  const openAddVendor = () => {
    setVendorForm(emptyVendorForm);
    setShowVendorForm(true);
  };

  const closeVendorForm = () => {
    setShowVendorForm(false);
    setVendorForm(emptyVendorForm);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) return;
    setSavingVendor(true);

    const payload = {
      name: vendorForm.name.trim(),
      vendor_type: vendorForm.vendor_type.trim() || 'Products',
      gst_number: vendorForm.gst_number.trim() || null,
      contact_name: vendorForm.contact_name.trim() || null,
      phone_number: vendorForm.phone_number.trim() || null,
      place: vendorForm.place.trim() || null,
      notes: vendorForm.notes.trim() || null,
    };

    const { data } = await supabase.from('vendors').insert(payload).select('*').single();
    setSavingVendor(false);
    closeVendorForm();
    await loadVendors();
    if (data) {
      setSelectedVendor(data as Vendor);
    }
  };

  const updateProductRow = (index: number, field: keyof ProductRow, value: string) => {
    setProductRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
    setDirty(true);
  };

  const addProductRow = () => {
    setProductRows((prev) => [...prev, emptyProductRow()]);
    setDirty(true);
  };

  const removeProductRow = (index: number) => {
    setProductRows((prev) => {
      const row = prev[index];
      if (row && !row.isNew) {
        setRemovedIds((ids) => [...ids, row.id]);
      }
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyProductRow()];
    });
    setDirty(true);
  };

  const handleSaveProducts = async () => {
    if (!selectedVendor) return;
    setSavingProducts(true);

    const validRows = productRows.filter((row) => row.name.trim());
    const now = new Date().toISOString();

    if (removedIds.length > 0) {
      await supabase.from('vendor_products').delete().in('id', removedIds);
    }

    for (const row of validRows) {
      const payload = {
        vendor_id: selectedVendor.id,
        name: row.name.trim(),
        sku: row.sku.trim() || null,
        qty: parseNumber(row.qty),
        price: parseNumber(row.price),
        updated_at: now,
      };

      if (row.isNew) {
        await supabase.from('vendor_products').insert(payload);
      } else {
        await supabase.from('vendor_products').update(payload).eq('id', row.id);
      }
    }

    setSavingProducts(false);
    await loadProducts(selectedVendor.id);
    await loadVendors();
  };

  const lineTotal = productRows.reduce((sum, row) => {
    const qty = parseNumber(row.qty);
    const price = parseNumber(row.price);
    if (qty == null || price == null) return sum;
    return sum + qty * price;
  }, 0);

  if (selectedVendor) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={backToVendors}
              className="mt-0.5 p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-500 transition-colors"
              title="Back to vendors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider mb-0.5">Vendor catalog</p>
              <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight leading-none">{selectedVendor.name}</h1>
              <p className="text-[13px] text-zinc-400 mt-1">
                Spreadsheet of products you buy from this vendor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addProductRow}
              className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-lg text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Plus size={15} /> Add Row
            </button>
            <button
              onClick={handleSaveProducts}
              disabled={!dirty || savingProducts}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              {savingProducts ? 'Saving…' : 'Save Spreadsheet'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
          <div className="bg-white rounded-xl border border-zinc-100 p-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Products</p>
            <p className="text-[22px] font-bold text-zinc-900 mt-1">
              {productRows.filter((r) => r.name.trim()).length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Est. order value</p>
            <p className="text-[22px] font-bold text-zinc-900 mt-1">{formatCurrency(lineTotal)}</p>
          </div>
          {dirty && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Unsaved</p>
              <p className="text-[13px] text-amber-700 mt-1">Save to keep your changes</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {loadingProducts ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-10">#</th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider min-w-[200px]">
                      Product Name
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider min-w-[120px]">
                      SKU
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-24">
                      Qty
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-28">
                      Price (₹)
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-28">
                      Line Total
                    </th>
                    <th className="px-3 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, index) => {
                    const qty = parseNumber(row.qty);
                    const price = parseNumber(row.price);
                    const total = qty != null && price != null ? qty * price : null;
                    return (
                      <tr key={row.id} className="border-b border-zinc-50 group">
                        <td className="px-3 py-1.5 text-[12px] text-zinc-400 font-mono">{index + 1}</td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            className={cellCls}
                            value={row.name}
                            onChange={(e) => updateProductRow(index, 'name', e.target.value)}
                            placeholder="Product name"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            className={cellCls + ' font-mono text-[12px]'}
                            value={row.sku}
                            onChange={(e) => updateProductRow(index, 'sku', e.target.value)}
                            placeholder="SKU-001"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={cellCls}
                            value={row.qty}
                            onChange={(e) => updateProductRow(index, 'qty', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={cellCls}
                            value={row.price}
                            onChange={(e) => updateProductRow(index, 'price', e.target.value)}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-1.5 text-[13px] text-zinc-600 whitespace-nowrap">
                          {formatCurrency(total)}
                        </td>
                        <td className="px-2 py-1">
                          <button
                            onClick={() => removeProductRow(index)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-zinc-300 hover:text-red-400 transition-all"
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
          <ShoppingBag size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight leading-none">Products</h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">Track what you buy from each vendor</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 p-5 max-w-xs">
        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Vendors</p>
        <p className="text-[26px] font-bold text-zinc-900 leading-none mt-2">
          {loading ? <span className="text-zinc-300">—</span> : vendors.length}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-900">Product Vendors</h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">Create a vendor, then open their spreadsheet</p>
          </div>
          <button
            onClick={openAddVendor}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> New Vendor
          </button>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-16 text-center">
              <Handshake size={32} className="text-zinc-200 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-400 mb-4">No vendors yet. Create one to start your product spreadsheet.</p>
              <button
                onClick={openAddVendor}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={15} /> New Vendor
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {['Vendor', 'Type', 'Products', 'Contact', 'Place', ''].map((h) => (
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
                  {vendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer"
                      onClick={() => openVendor(vendor)}
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-zinc-900 whitespace-nowrap">{vendor.name}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{vendor.vendor_type || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                          <Table2 size={12} />
                          {productCounts[vendor.id] || 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{vendor.contact_name || '—'}</td>
                      <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{vendor.place || '—'}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openVendor(vendor)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil size={13} /> Open spreadsheet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showVendorForm && (
        <Modal onClose={closeVendorForm}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[16px] font-semibold text-zinc-900">New Vendor</h2>
            <button onClick={closeVendorForm} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleVendorSubmit} className="p-6 space-y-4">
            <Field label="Vendor Name" required>
              <input
                type="text"
                className={inputCls}
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="e.g. Crystal Wholesaler Ltd."
                required
                autoFocus
              />
            </Field>
            <Field label="Vendor Type">
              <input
                type="text"
                className={inputCls}
                value={vendorForm.vendor_type}
                onChange={(e) => setVendorForm({ ...vendorForm, vendor_type: e.target.value })}
                placeholder="Products"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Name">
                <input
                  type="text"
                  className={inputCls}
                  value={vendorForm.contact_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, contact_name: e.target.value })}
                  placeholder="Person to reach"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  className={inputCls}
                  value={vendorForm.phone_number}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone_number: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </Field>
            </div>
            <Field label="Place">
              <input
                type="text"
                className={inputCls}
                value={vendorForm.place}
                onChange={(e) => setVendorForm({ ...vendorForm, place: e.target.value })}
                placeholder="City or address"
              />
            </Field>
            <Field label="Notes">
              <textarea
                className={inputCls + ' resize-none'}
                rows={2}
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                placeholder="Payment terms, specialties, etc."
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeVendorForm}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingVendor}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {savingVendor ? 'Creating…' : 'Create & Open Spreadsheet'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
