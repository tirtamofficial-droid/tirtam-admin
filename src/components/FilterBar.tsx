import { useStore } from '../store/useStore';
import { departments, statuses, priorities } from '../utils/helpers';
import { Filter, X } from 'lucide-react';

export default function FilterBar() {
  const { filters, setFilters, resetFilters, employees } = useStore();
  const hasFilters = filters.owner || filters.department || filters.status || filters.priority || filters.deadlineBefore;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter size={14} className="text-zinc-300" />

      <select
        value={filters.owner}
        onChange={(e) => setFilters({ owner: e.target.value })}
        className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
      >
        <option value="">All Owners</option>
        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      <select
        value={filters.department}
        onChange={(e) => setFilters({ department: e.target.value as any })}
        className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
      >
        <option value="">All Departments</option>
        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <select
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value as any })}
        className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
      >
        <option value="">All Statuses</option>
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => setFilters({ priority: e.target.value as any })}
        className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
      >
        <option value="">All Priorities</option>
        {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <input
        type="date"
        value={filters.deadlineBefore}
        onChange={(e) => setFilters({ deadlineBefore: e.target.value })}
        className="px-2.5 py-1.5 text-[12px] border border-zinc-100 rounded-lg bg-white focus:outline-none focus:border-zinc-300 text-zinc-600"
        title="Deadline before"
      />

      {hasFilters && (
        <button onClick={resetFilters} className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
