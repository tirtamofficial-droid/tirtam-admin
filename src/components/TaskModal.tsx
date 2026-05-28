import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { departments, statuses, priorities } from '../utils/helpers';
import { X } from 'lucide-react';
import type { Department, TaskStatus, Priority } from '../types';

export default function TaskModal() {
  const { taskModalOpen, setTaskModalOpen, editingTask, setEditingTask, addTask, updateTask, employees, activeDepartment } = useStore();

  const [form, setForm] = useState({
    name: '',
    description: '',
    owner: '',
    department: '' as Department | '',
    priority: 'Medium' as Priority,
    status: 'Pending' as TaskStatus,
    deadline: '',
    notes: '',
    tags: '',
  });

  useEffect(() => {
    if (editingTask) {
      setForm({
        name: editingTask.name,
        description: editingTask.description,
        owner: editingTask.owner,
        department: editingTask.department,
        priority: editingTask.priority,
        status: editingTask.status,
        deadline: editingTask.deadline.slice(0, 10),
        notes: editingTask.notes,
        tags: editingTask.tags.join(', '),
      });
    } else {
      setForm({
        name: '',
        description: '',
        owner: '',
        department: activeDepartment || '',
        priority: 'Medium',
        status: 'Pending',
        deadline: '',
        notes: '',
        tags: '',
      });
    }
  }, [editingTask, taskModalOpen, activeDepartment]);

  if (!taskModalOpen) return null;

  const isSetupTask = Boolean(
    editingTask &&
    editingTask.status !== 'Completed' &&
    (!editingTask.owner || !editingTask.owner.trim())
  );

  const modalTitle = editingTask
    ? isSetupTask
      ? 'Set Up Task'
      : 'Edit Task'
    : 'Create Task';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.department || !form.deadline) return;
    if (isSetupTask && !form.owner) return;

    const taskData = {
      name: form.name,
      description: form.description,
      owner: form.owner || '',
      department: form.department as Department,
      priority: form.priority,
      status: form.status,
      deadline: new Date(form.deadline).toISOString(),
      notes: form.notes,
      dependencies: editingTask?.dependencies || [],
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    close();
  };

  const close = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center sm:p-4 animate-fade-in" onClick={close}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-float w-full sm:max-w-lg max-h-[95vh] overflow-y-auto border border-zinc-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-[16px] font-semibold text-zinc-900">{modalTitle}</h2>
            {isSetupTask && (
              <p className="text-[12px] text-purple-600 mt-0.5">Assign an owner and fill in the details below</p>
            )}
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-zinc-50 text-zinc-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Task Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-[14px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 transition-all"
              placeholder="Enter task name..."
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-[14px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 resize-none transition-all"
              rows={2}
              placeholder="Brief description..."
            />
          </div>

          {isSetupTask ? (
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-4">
              <p className="text-[12px] font-semibold text-purple-700">Task details</p>
              <div>
                <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Owner *</label>
                <select
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
                  required
                >
                  <option value="">Select owner</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
                  >
                    {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Deadline *</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                  className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Department *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value as Department })}
                className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
                required
              >
                <option value="">Select</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Owner</label>
              <select
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
              >
                <option value="">Unassigned (Upcoming)</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
              >
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 bg-white"
              >
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Deadline *</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 text-[13px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900"
                required
              />
            </div>
          </div>
          </>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 text-[14px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 resize-none transition-all"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-zinc-600 mb-1.5">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-3.5 py-2.5 text-[14px] border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={close} className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
              {isSetupTask ? 'Save & Assign' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
