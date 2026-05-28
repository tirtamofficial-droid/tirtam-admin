import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import TaskTable from '../components/TaskTable';
import FilterBar from '../components/FilterBar';
import SortBar from '../components/SortBar';
import { sortTasks, type TaskSortDir, type TaskSortKey } from '../utils/helpers';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const { filters, setFilters, getFilteredTasks, employees } = useStore();
  const [sortKey, setSortKey] = useState<TaskSortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<TaskSortDir>('desc');
  const filtered = getFilteredTasks();
  const getOwnerName = (id: string) => employees.find((e) => e.id === id)?.name || '';
  const displayTasks = useMemo(
    () => sortTasks(filtered, sortKey, sortDir, getOwnerName),
    [filtered, sortKey, sortDir, employees]
  );

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

      <div className="space-y-2">
        <div className="flex flex-wrap items-start gap-2">
          <FilterBar />
          <SortBar
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(key, dir) => {
              setSortKey(key);
              setSortDir(dir);
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="px-5 py-2.5 border-b border-zinc-50 bg-zinc-50/50">
          <p className="text-[12px] text-zinc-400 font-medium">{displayTasks.length} tasks found</p>
        </div>
        <TaskTable tasks={displayTasks} enableHeaderSort={false} />
      </div>
    </div>
  );
}
