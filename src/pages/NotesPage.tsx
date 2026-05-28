import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, X, StickyNote, Pencil } from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const emptyForm = { name: '', description: '' };

const cardAccents = [
  { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-100/80', dot: 'bg-amber-400' },
  { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-blue-100/80', dot: 'bg-blue-400' },
  { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', border: 'border-emerald-100/80', dot: 'bg-emerald-400' },
  { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-100/80', dot: 'bg-violet-400' },
  { bg: 'bg-gradient-to-br from-rose-50 to-pink-50', border: 'border-rose-100/80', dot: 'bg-rose-400' },
  { bg: 'bg-gradient-to-br from-sky-50 to-cyan-50', border: 'border-sky-100/80', dot: 'bg-sky-400' },
];

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
          <h3 className="text-[16px] font-semibold text-zinc-900 mb-1">Delete note?</h3>
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

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingNote(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setForm({ name: note.name, description: note.description });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      updated_at: new Date().toISOString(),
    };

    if (editingNote) {
      await supabase.from('notes').update(payload).eq('id', editingNote.id);
    } else {
      await supabase.from('notes').insert(payload);
    }

    setSaving(false);
    closeForm();
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('notes').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
            <StickyNote size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight leading-none">Notes</h1>
            <p className="text-[13px] text-zinc-400 mt-0.5">Capture ideas, reminders, and quick thoughts</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Add Note
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 px-5 py-4 min-w-[120px]">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Notes</p>
          <p className="text-[26px] font-bold text-zinc-900 leading-none mt-2">
            {loading ? <span className="text-zinc-300">—</span> : notes.length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-7 h-7 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
          <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <StickyNote size={24} className="text-zinc-300" />
          </div>
          <p className="text-[15px] font-medium text-zinc-600 mb-1">No notes yet</p>
          <p className="text-[13px] text-zinc-400 mb-5">Start capturing your ideas and reminders</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Create your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note, i) => {
            const accent = cardAccents[i % cardAccents.length];
            return (
              <article
                key={note.id}
                className={`group relative rounded-2xl border ${accent.border} ${accent.bg} p-5 flex flex-col min-h-[180px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}
                onClick={() => openEdit(note)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${accent.dot} mt-1.5 flex-shrink-0`} />
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(note);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-zinc-400 hover:text-indigo-600 transition-colors"
                      title="Edit note"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(note);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-zinc-400 hover:text-red-500 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 mb-2 pr-2">
                  {note.name}
                </h3>

                <p className="text-[13px] text-zinc-600 leading-relaxed line-clamp-4 flex-1">
                  {note.description || <span className="text-zinc-400 italic">No description</span>}
                </p>

                <p className="text-[11px] text-zinc-400 mt-4 pt-3 border-t border-black/[0.04]">
                  {format(new Date(note.created_at), 'MMM d, yyyy')}
                </p>
              </article>
            );
          })}

          <button
            onClick={openAdd}
            className="rounded-2xl border-2 border-dashed border-zinc-200 p-5 flex flex-col items-center justify-center min-h-[180px] text-zinc-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-indigo-100 flex items-center justify-center mb-2 transition-colors">
              <Plus size={18} className="group-hover:text-indigo-600" />
            </div>
            <span className="text-[13px] font-medium">Add another note</span>
          </button>
        </div>
      )}

      {showForm && (
        <Modal onClose={closeForm}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[16px] font-semibold text-zinc-900">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Field label="Name" required>
              <input
                type="text"
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Meeting ideas, Vendor follow-up"
                required
                autoFocus
              />
            </Field>
            <Field label="Description">
              <textarea
                className={inputCls + ' resize-none min-h-[120px]'}
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Write your note here..."
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
                {saving ? 'Saving…' : editingNote ? 'Save Changes' : 'Add Note'}
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
