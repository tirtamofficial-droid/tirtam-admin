import { useStore } from '../store/useStore';
import TaskTable from '../components/TaskTable';
import FilterBar from '../components/FilterBar';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const { filters, setFilters, getFilteredTasks } = useStore();
  const filtered = getFilteredTasks();

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight flex items-center gap-2">
          <Search size={20} /> Search & Filter
        </h1>
        <p className="text-[13px] text-zinc-400 mt-1">Find any task across all departments</p>
      </div>

      <div className="relative max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="w-full pl-12 pr-4 py-3 text-[14px] bg-white border border-zinc-200 rounded-xl
            focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 transition-all placeholder:text-zinc-300"
          placeholder="Search tasks by name, description, tags..."
          autoFocus
        />
      </div>

      <FilterBar />

      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-2.5 border-b border-zinc-50 bg-zinc-50/50">
          <p className="text-[12px] text-zinc-400 font-medium">{filtered.length} tasks found</p>
        </div>
        <TaskTable tasks={filtered} />
      </div>
    </div>
  );
}
