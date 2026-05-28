import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, IndianRupee, ShoppingCart, Receipt, Wallet } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorPayment {
  id: string;
  vendor_name: string;
  description: string | null;
  amount: number;
  quantity: number | null;
  quantity_unit: string | null;
  purchase_date: string;
  paid_by: string;
  payment_mode: string;
  notes: string | null;
  created_at: string;
}

interface OtherSpending {
  id: string;
  title: string;
  category: string;
  amount: number;
  spent_date: string;
  paid_by: string;
  payment_mode: string;
  notes: string | null;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];
const PAID_BY_OPTIONS = ['Samarth Rai', 'Karthik Shetty', 'Dhanraj Shetty'];
const SPENDING_CATEGORIES = [
  'Legal & Compliance',
  'Technology',
  'Marketing',
  'Office & Operations',
  'Travel',
  'Miscellaneous',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Empty form defaults ──────────────────────────────────────────────────────

const emptyVendorForm = {
  vendor_name: '',
  description: '',
  amount: '',
  quantity: '',
  quantity_unit: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  paid_by: 'Samarth Rai',
  payment_mode: 'Cash',
  notes: '',
};

const emptySpendingForm = {
  title: '',
  category: 'Miscellaneous',
  amount: '',
  spent_date: new Date().toISOString().slice(0, 10),
  paid_by: 'Samarth Rai',
  payment_mode: 'Cash',
  notes: '',
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────

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

// ─── Confirm delete dialog ────────────────────────────────────────────────────

function ConfirmDelete({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold text-zinc-900 mb-1">Delete entry?</h3>
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

// ─── Field helpers ────────────────────────────────────────────────────────────

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

// ─── Pagination controls ──────────────────────────────────────────────────────

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

// ─── Main Finance Page ────────────────────────────────────────────────────────

export default function FinancePage() {
  // Data
  const [vendorRows, setVendorRows] = useState<VendorPayment[]>([]);
  const [otherRows, setOtherRows] = useState<OtherSpending[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [vendorPage, setVendorPage] = useState(1);
  const [otherPage, setOtherPage] = useState(1);

  // Vendor form state
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [vendorDeleteTarget, setVendorDeleteTarget] = useState<VendorPayment | null>(null);

  // Other spendings form state
  const [showOtherForm, setShowOtherForm] = useState(false);
  const [otherForm, setOtherForm] = useState(emptySpendingForm);
  const [otherSaving, setOtherSaving] = useState(false);
  const [otherDeleteTarget, setOtherDeleteTarget] = useState<OtherSpending | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: vData }, { data: oData }] = await Promise.all([
      supabase.from('vendor_payments').select('*').order('purchase_date', { ascending: false }),
      supabase.from('other_spendings').select('*').order('spent_date', { ascending: false }),
    ]);
    setVendorRows((vData as VendorPayment[]) ?? []);
    setOtherRows((oData as OtherSpending[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Totals
  const vendorTotal = vendorRows.reduce((s, r) => s + Number(r.amount), 0);
  const otherTotal = otherRows.reduce((s, r) => s + Number(r.amount), 0);
  const grandTotal = vendorTotal + otherTotal;

  // Paginated slices
  const vendorPages = Math.max(1, Math.ceil(vendorRows.length / PAGE_SIZE));
  const otherPages = Math.max(1, Math.ceil(otherRows.length / PAGE_SIZE));
  const vendorSlice = vendorRows.slice((vendorPage - 1) * PAGE_SIZE, vendorPage * PAGE_SIZE);
  const otherSlice = otherRows.slice((otherPage - 1) * PAGE_SIZE, otherPage * PAGE_SIZE);

  // Vendor handlers
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.vendor_name || !vendorForm.amount || !vendorForm.purchase_date) return;
    setVendorSaving(true);
    await supabase.from('vendor_payments').insert({
      vendor_name: vendorForm.vendor_name,
      description: vendorForm.description || null,
      amount: parseFloat(vendorForm.amount),
      quantity: vendorForm.quantity ? parseFloat(vendorForm.quantity) : null,
      quantity_unit: vendorForm.quantity_unit || null,
      purchase_date: vendorForm.purchase_date,
      paid_by: vendorForm.paid_by,
      payment_mode: vendorForm.payment_mode,
      notes: vendorForm.notes || null,
    });
    setVendorSaving(false);
    setShowVendorForm(false);
    setVendorForm(emptyVendorForm);
    setVendorPage(1);
    load();
  };

  const handleVendorDelete = async () => {
    if (!vendorDeleteTarget) return;
    await supabase.from('vendor_payments').delete().eq('id', vendorDeleteTarget.id);
    setVendorDeleteTarget(null);
    load();
  };

  // Other spendings handlers
  const handleOtherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherForm.title || !otherForm.category || !otherForm.amount || !otherForm.spent_date) return;
    setOtherSaving(true);
    await supabase.from('other_spendings').insert({
      title: otherForm.title,
      category: otherForm.category,
      amount: parseFloat(otherForm.amount),
      spent_date: otherForm.spent_date,
      paid_by: otherForm.paid_by,
      payment_mode: otherForm.payment_mode,
      notes: otherForm.notes || null,
    });
    setOtherSaving(false);
    setShowOtherForm(false);
    setOtherForm(emptySpendingForm);
    setOtherPage(1);
    load();
  };

  const handleOtherDelete = async () => {
    if (!otherDeleteTarget) return;
    await supabase.from('other_spendings').delete().eq('id', otherDeleteTarget.id);
    setOtherDeleteTarget(null);
    load();
  };

  const categoryColor: Record<string, string> = {
    'Legal & Compliance': 'bg-purple-50 text-purple-600',
    Technology: 'bg-blue-50 text-blue-600',
    Marketing: 'bg-pink-50 text-pink-600',
    'Office & Operations': 'bg-amber-50 text-amber-600',
    Travel: 'bg-teal-50 text-teal-600',
    Miscellaneous: 'bg-zinc-100 text-zinc-600',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
          <IndianRupee size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight leading-none">Finance</h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">Track vendor payments and operational expenses</p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Vendor Spending</p>
            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
              <ShoppingCart size={15} className="text-zinc-400" />
            </div>
          </div>
          <p className="text-[26px] font-bold text-zinc-900 leading-none">
            {loading ? <span className="text-zinc-300">—</span> : formatINR(vendorTotal)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5">{vendorRows.length} entries</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Other Spending</p>
            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
              <Receipt size={15} className="text-zinc-400" />
            </div>
          </div>
          <p className="text-[26px] font-bold text-zinc-900 leading-none">
            {loading ? <span className="text-zinc-300">—</span> : formatINR(otherTotal)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5">{otherRows.length} entries</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Spending</p>
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Wallet size={15} className="text-white" />
            </div>
          </div>
          <p className="text-[26px] font-bold text-zinc-900 leading-none">
            {loading ? <span className="text-zinc-300">—</span> : formatINR(grandTotal)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1.5">All categories combined</p>
        </div>
      </div>

      {/* ── Vendor Payments Section ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-900 flex items-center gap-2">
              <ShoppingCart size={16} className="text-zinc-400" />
              Vendor Payments
            </h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">{vendorRows.length} entries</p>
          </div>
          <button
            onClick={() => { setVendorForm(emptyVendorForm); setShowVendorForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Add Entry
          </button>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : vendorRows.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart size={32} className="text-zinc-200 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-400">No vendor payments yet. Add your first entry.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['Vendor Name', 'Description', 'Amount (₹)', 'Qty', 'Purchase Date', 'Paid By', 'Mode', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendorSlice.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 text-[13px] font-medium text-zinc-900 whitespace-nowrap">{row.vendor_name}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 max-w-[180px] truncate">{row.description || '—'}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-zinc-900 whitespace-nowrap">{formatINR(Number(row.amount))}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">
                          {row.quantity != null ? `${row.quantity}${row.quantity_unit ? ' ' + row.quantity_unit : ''}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{formatDate(row.purchase_date)}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{row.paid_by}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-medium text-zinc-600">
                            {row.payment_mode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setVendorDeleteTarget(row)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={vendorPage}
                totalPages={vendorPages}
                onPrev={() => setVendorPage((p) => Math.max(1, p - 1))}
                onNext={() => setVendorPage((p) => Math.min(vendorPages, p + 1))}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Other Spendings Section ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-900 flex items-center gap-2">
              <Receipt size={16} className="text-zinc-400" />
              Other Spendings
            </h2>
            <p className="text-[12px] text-zinc-400 mt-0.5">{otherRows.length} entries</p>
          </div>
          <button
            onClick={() => { setOtherForm(emptySpendingForm); setShowOtherForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Add Entry
          </button>
        </div>

        <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            </div>
          ) : otherRows.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt size={32} className="text-zinc-200 mx-auto mb-3" />
              <p className="text-[13px] text-zinc-400">No spendings recorded yet. Add your first entry.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {['Title', 'Category', 'Amount (₹)', 'Date', 'Paid By', 'Mode', 'Notes', ''].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {otherSlice.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 text-[13px] font-medium text-zinc-900 whitespace-nowrap">{row.title}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${categoryColor[row.category] ?? 'bg-zinc-100 text-zinc-600'}`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-zinc-900 whitespace-nowrap">{formatINR(Number(row.amount))}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{formatDate(row.spent_date)}</td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 whitespace-nowrap">{row.paid_by}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-medium text-zinc-600">
                            {row.payment_mode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-zinc-500 max-w-[160px] truncate">{row.notes || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setOtherDeleteTarget(row)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={otherPage}
                totalPages={otherPages}
                onPrev={() => setOtherPage((p) => Math.max(1, p - 1))}
                onNext={() => setOtherPage((p) => Math.min(otherPages, p + 1))}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Vendor add modal ──────────────────────────────────────────────────── */}
      {showVendorForm && (
        <Modal onClose={() => setShowVendorForm(false)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[16px] font-semibold text-zinc-900">Add Vendor Payment</h2>
            <button onClick={() => setShowVendorForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleVendorSubmit} className="p-6 space-y-4">
            <Field label="Vendor Name" required>
              <input
                type="text"
                className={inputCls}
                value={vendorForm.vendor_name}
                onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                placeholder="e.g. Crystal Wholesaler Ltd."
                required
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                className={inputCls}
                value={vendorForm.description}
                onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                placeholder="What was purchased?"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (₹)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={vendorForm.amount}
                  onChange={(e) => setVendorForm({ ...vendorForm, amount: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </Field>
              <Field label="Purchase Date" required>
                <input
                  type="date"
                  className={inputCls}
                  value={vendorForm.purchase_date}
                  onChange={(e) => setVendorForm({ ...vendorForm, purchase_date: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity">
                <input
                  type="number"
                  className={inputCls}
                  value={vendorForm.quantity}
                  onChange={(e) => setVendorForm({ ...vendorForm, quantity: e.target.value })}
                  placeholder="e.g. 50"
                  min="0"
                  step="0.01"
                />
              </Field>
              <Field label="Unit">
                <input
                  type="text"
                  className={inputCls}
                  value={vendorForm.quantity_unit}
                  onChange={(e) => setVendorForm({ ...vendorForm, quantity_unit: e.target.value })}
                  placeholder="pieces, kg, boxes…"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Paid By">
                <select
                  className={inputCls}
                  value={vendorForm.paid_by}
                  onChange={(e) => setVendorForm({ ...vendorForm, paid_by: e.target.value })}
                >
                  {PAID_BY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Payment Mode">
                <select
                  className={inputCls}
                  value={vendorForm.payment_mode}
                  onChange={(e) => setVendorForm({ ...vendorForm, payment_mode: e.target.value })}
                >
                  {PAYMENT_MODES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                className={inputCls + ' resize-none'}
                rows={2}
                value={vendorForm.notes}
                onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                placeholder="Any additional notes…"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowVendorForm(false)}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={vendorSaving}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {vendorSaving ? 'Saving…' : 'Add Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Other spendings add modal ─────────────────────────────────────────── */}
      {showOtherForm && (
        <Modal onClose={() => setShowOtherForm(false)}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[16px] font-semibold text-zinc-900">Add Spending</h2>
            <button onClick={() => setShowOtherForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleOtherSubmit} className="p-6 space-y-4">
            <Field label="Title" required>
              <input
                type="text"
                className={inputCls}
                value={otherForm.title}
                onChange={(e) => setOtherForm({ ...otherForm, title: e.target.value })}
                placeholder="e.g. Domain renewal"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" required>
                <select
                  className={inputCls}
                  value={otherForm.category}
                  onChange={(e) => setOtherForm({ ...otherForm, category: e.target.value })}
                  required
                >
                  {SPENDING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Amount (₹)" required>
                <input
                  type="number"
                  className={inputCls}
                  value={otherForm.amount}
                  onChange={(e) => setOtherForm({ ...otherForm, amount: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" required>
                <input
                  type="date"
                  className={inputCls}
                  value={otherForm.spent_date}
                  onChange={(e) => setOtherForm({ ...otherForm, spent_date: e.target.value })}
                  required
                />
              </Field>
              <Field label="Paid By">
                <select
                  className={inputCls}
                  value={otherForm.paid_by}
                  onChange={(e) => setOtherForm({ ...otherForm, paid_by: e.target.value })}
                >
                  {PAID_BY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Payment Mode">
              <select
                className={inputCls}
                value={otherForm.payment_mode}
                onChange={(e) => setOtherForm({ ...otherForm, payment_mode: e.target.value })}
              >
                {PAYMENT_MODES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Notes">
              <textarea
                className={inputCls + ' resize-none'}
                rows={2}
                value={otherForm.notes}
                onChange={(e) => setOtherForm({ ...otherForm, notes: e.target.value })}
                placeholder="Any additional notes…"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOtherForm(false)}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={otherSaving}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {otherSaving ? 'Saving…' : 'Add Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmations */}
      {vendorDeleteTarget && (
        <ConfirmDelete
          label={`${vendorDeleteTarget.vendor_name} — ${formatINR(Number(vendorDeleteTarget.amount))}`}
          onConfirm={handleVendorDelete}
          onCancel={() => setVendorDeleteTarget(null)}
        />
      )}
      {otherDeleteTarget && (
        <ConfirmDelete
          label={`${otherDeleteTarget.title} — ${formatINR(Number(otherDeleteTarget.amount))}`}
          onConfirm={handleOtherDelete}
          onCancel={() => setOtherDeleteTarget(null)}
        />
      )}
    </div>
  );
}
