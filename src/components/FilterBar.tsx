import { useState } from 'react';
import { useStore } from '../store/useStore';
import { statuses, priorities } from '../utils/helpers';
import { Filter, X, ChevronDown } from 'lucide-react';

export default function FilterBar() {
  const { filters, setFilters, resetFilters, employees } = useStore();
  const [open, setOpen] = useState(false);
  const hasFilters = filters.owner || filters.status || filters.priority;

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors
          ${open || hasFilters
            ? 'bg-white text-zinc-900 border-zinc-200 shadow-sm'
            : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:text-zinc-700 hover:border-zinc-200'
          }`}
      >
        <Filter size={14} className={hasFilters ? 'text-indigo-500' : 'text-zinc-400'} />
        Filters
        {hasFilters && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        )}
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={filters.owner}
              onChange={(e) => setFilters({ owner: e.target.value })}
              className="w-full min-w-0 px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
            >
              <option value="">Owner</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value as typeof filters.status })}
              className="w-full min-w-0 px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
            >
              <option value="">Status</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ priority: e.target.value as typeof filters.priority })}
              className="w-full min-w-0 px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
            >
              <option value="">Priority</option>
              {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="mt-2 flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
