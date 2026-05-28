import { useState } from 'react';
import { useStore } from '../store/useStore';
import { statusColors, priorityColors, formatDate, isOverdue, statuses, priorities } from '../utils/helpers';
import type { Task, TaskStatus, Priority } from '../types';
import { MoreHorizontal, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  tasks: Task[];
  enableHeaderSort?: boolean;
}

type SortKey = 'name' | 'priority' | 'status' | 'deadline' | 'owner' | 'updatedAt';
type SortDir = 'asc' | 'desc';

const priorityOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const statusOrder: Record<TaskStatus, number> = { Pending: 0, 'In Progress': 1, Blocked: 2, Review: 3, Completed: 4 };

export default function TaskTable({ tasks, enableHeaderSort = true }: Props) {
  const { employees, updateTask, deleteTask, setEditingTask, setTaskModalOpen } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editCell, setEditCell] = useState<{ id: string; field: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const getOwnerName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';
  const getOwnerAvatar = (id: string) => employees.find((e) => e.id === id)?.avatar || '??';

  const sorted = enableHeaderSort
    ? [...tasks].sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case 'name': cmp = a.name.localeCompare(b.name); break;
          case 'priority': cmp = priorityOrder[a.priority] - priorityOrder[b.priority]; break;
          case 'status': cmp = statusOrder[a.status] - statusOrder[b.status]; break;
          case 'deadline': cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); break;
          case 'owner': cmp = getOwnerName(a.owner).localeCompare(getOwnerName(b.owner)); break;
          case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : tasks;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-0 group-hover:opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-zinc-900" /> : <ChevronDown size={12} className="text-zinc-900" />;
  };

  const ColHeader = ({ col, label, className }: { col: SortKey; label: string; className?: string }) => (
    <th
      className={`text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-3 select-none whitespace-nowrap ${className || ''}
        ${enableHeaderSort ? 'cursor-pointer group' : ''}`}
      onClick={enableHeaderSort ? () => toggleSort(col) : undefined}
    >
      <div className="flex items-center gap-1">
        {label}
        {enableHeaderSort && <SortIcon col={col} />}
      </div>
    </th>
  );

  const handleInlineEdit = (task: Task, field: string, value: string) => {
    updateTask(task.id, { [field]: value } as Partial<Task>);
    setEditCell(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-[14px] font-medium text-zinc-500">No tasks found</p>
        <p className="text-[12px] mt-1">Create a new task to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: stacked card list */}
      <div className="md:hidden divide-y divide-zinc-50">
        {sorted.map((task) => {
          const overdue = isOverdue(task);
          return (
            <div
              key={task.id}
              className="px-4 py-3 hover:bg-zinc-50/60 transition-colors"
              onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
            >
              <p className={`text-[13px] font-medium leading-snug ${overdue ? 'text-red-600' : 'text-zinc-800'}`}>
                {task.name}
              </p>
              {task.description && (
                <p className="text-[12px] text-zinc-400 mt-1 leading-snug line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-2">
                {task.owner && task.owner.trim() !== '' ? (
                  <span className="text-[12px] text-zinc-500">{getOwnerName(task.owner)}</span>
                ) : (
                  <span className="text-[11px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded">Upcoming</span>
                )}
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                  {task.priority}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColors[task.status].dot}`}></span>
                  {task.status}
                </span>
                <span className={`text-[12px] ${overdue ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
                  {formatDate(task.deadline)}
                </span>
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-100 rounded text-[10px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <ColHeader col="name" label="Task" className="min-w-[200px] pl-5" />
            <ColHeader col="owner" label="Owner" />
            <ColHeader col="priority" label="Priority" />
            <ColHeader col="status" label="Status" />
            <ColHeader col="deadline" label="Deadline" />
            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-3 whitespace-nowrap">Tags</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => {
            const overdue = isOverdue(task);
            return (
              <tr
                key={task.id}
                className="border-b border-zinc-50 hover:bg-zinc-50/60 transition-colors group"
              >
                <td className="px-3 py-3 pl-5">
                  {editCell?.id === task.id && editCell.field === 'name' ? (
                    <input
                      autoFocus
                      defaultValue={task.name}
                      className="w-full px-2 py-1 text-[13px] border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900/20"
                      onBlur={(e) => handleInlineEdit(task, 'name', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditCell(null); }}
                    />
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => setEditCell({ id: task.id, field: 'name' })}
                    >
                      <p className={`text-[13px] font-medium ${overdue ? 'text-red-600' : 'text-zinc-800'}`}>
                        {task.name}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  )}
                </td>

                <td className="px-3 py-3">
                  {editCell?.id === task.id && editCell.field === 'owner' ? (
                    <select
                      autoFocus
                      value={task.owner}
                      onChange={(e) => handleInlineEdit(task, 'owner', e.target.value)}
                      onBlur={() => setEditCell(null)}
                      className="px-2 py-1 text-[12px] border border-zinc-200 rounded-lg focus:outline-none bg-white"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditCell({ id: task.id, field: 'owner' })}>
                      {task.owner && task.owner.trim() !== '' ? (
                        <>
                          <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 text-[9px] font-bold flex-shrink-0">
                            {getOwnerAvatar(task.owner)}
                          </div>
                          <span className="text-[12px] text-zinc-500">{getOwnerName(task.owner)}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded">Upcoming</span>
                      )}
                    </div>
                  )}
                </td>

                <td className="px-3 py-3">
                  {editCell?.id === task.id && editCell.field === 'priority' ? (
                    <select
                      autoFocus
                      value={task.priority}
                      onChange={(e) => handleInlineEdit(task, 'priority', e.target.value)}
                      onBlur={() => setEditCell(null)}
                      className="px-2 py-1 text-[12px] border border-zinc-200 rounded-lg focus:outline-none bg-white"
                    >
                      {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}
                      onClick={() => setEditCell({ id: task.id, field: 'priority' })}
                    >
                      {task.priority}
                    </span>
                  )}
                </td>

                <td className="px-3 py-3">
                  {editCell?.id === task.id && editCell.field === 'status' ? (
                    <select
                      autoFocus
                      value={task.status}
                      onChange={(e) => handleInlineEdit(task, 'status', e.target.value)}
                      onBlur={() => setEditCell(null)}
                      className="px-2 py-1 text-[12px] border border-zinc-200 rounded-lg focus:outline-none bg-white"
                    >
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${statusColors[task.status].bg} ${statusColors[task.status].text}`}
                      onClick={() => setEditCell({ id: task.id, field: 'status' })}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColors[task.status].dot}`}></span>
                      {task.status}
                    </span>
                  )}
                </td>

                <td className="px-3 py-3">
                  <span className={`text-[12px] ${overdue ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
                    {formatDate(task.deadline)}
                  </span>
                </td>

                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-zinc-50 border border-zinc-100 rounded text-[10px] text-zinc-400">
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-zinc-300">+{task.tags.length - 2}</span>
                    )}
                  </div>
                </td>

                <td className="px-2 py-3 relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === task.id ? null : task.id)}
                    className="p-1 rounded hover:bg-zinc-100 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen === task.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-float border border-zinc-100 py-1 z-20 animate-fade-in">
                      <button
                        onClick={() => { setEditingTask(task); setTaskModalOpen(true); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-600 hover:bg-zinc-50"
                      >
                        <Pencil size={13} /> Edit Task
                      </button>
                      <button
                        onClick={() => { deleteTask(task.id); setMenuOpen(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
