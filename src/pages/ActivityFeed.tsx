import { useStore } from '../store/useStore';
import { timeAgo, departmentIcons } from '../utils/helpers';
import { Activity, CheckCircle2, Plus, ArrowRight, Pencil, UserPlus, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import type { Department } from '../types';

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus size={12} className="text-zinc-500" />,
  updated: <Pencil size={12} className="text-amber-500" />,
  completed: <CheckCircle2 size={12} className="text-emerald-500" />,
  moved: <ArrowRight size={12} className="text-blue-500" />,
  assigned: <UserPlus size={12} className="text-purple-500" />,
  commented: <MessageCircle size={12} className="text-sky-500" />,
};

const actionColors: Record<string, string> = {
  created: 'bg-zinc-100',
  updated: 'bg-amber-100',
  completed: 'bg-emerald-100',
  moved: 'bg-blue-100',
  assigned: 'bg-purple-100',
  commented: 'bg-sky-100',
};

export default function ActivityFeed() {
  const { activities } = useStore();
  const [deptFilter, setDeptFilter] = useState<Department | ''>('');
  const [actionFilter, setActionFilter] = useState('');

  let filtered = activities;
  if (deptFilter) filtered = filtered.filter((a) => a.department === deptFilter);
  if (actionFilter) filtered = filtered.filter((a) => a.action === actionFilter);

  const grouped = new Map<string, typeof activities>();
  filtered.forEach((a) => {
    const dateKey = new Date(a.timestamp).toLocaleDateString();
    const list = grouped.get(dateKey) || [];
    list.push(a);
    grouped.set(dateKey, list);
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Activity size={20} /> Activity Feed
        </h1>
        <p className="text-[13px] text-zinc-400 mt-1">Live operational timeline across all departments</p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value as Department | '')}
          className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
        >
          <option value="">All Departments</option>
          {Object.keys(departmentIcons).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="completed">Completed</option>
          <option value="moved">Moved</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      {Array.from(grouped.entries()).map(([dateKey, dayActivities]) => (
        <div key={dateKey}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3 px-1">
            {dateKey === new Date().toLocaleDateString() ? 'Today' : dateKey}
          </p>
          <div className="space-y-1">
            {dayActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${actionColors[act.action]}`}>
                  {actionIcons[act.action]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-zinc-500 leading-relaxed">
                    <span className="font-semibold text-zinc-800">{act.userName}</span>{' '}
                    {act.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-300">{timeAgo(act.timestamp)}</span>
                    <span className="text-[10px] text-zinc-200">·</span>
                    <span className="text-[10px] text-zinc-300">{act.department}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-zinc-400">
          <Activity size={32} className="mb-3 opacity-30" />
          <p className="text-[13px]">No activity found</p>
        </div>
      )}
    </div>
  );
}
