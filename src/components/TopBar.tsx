import { useStore } from '../store/useStore';
import { Search, Plus, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const {
    sidebarCollapsed,
    setTaskModalOpen,
    filters,
    setFilters,
    activities,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useStore();
  const navigate = useNavigate();
  const recentCount = activities.filter(
    (a) => Date.now() - new Date(a.timestamp).getTime() < 3600000
  ).length;

  return (
    <header
      className={`fixed top-0 right-0 h-[57px] bg-white/90 backdrop-blur-xl border-b border-zinc-100 z-30 flex items-center justify-between px-3 md:px-6 transition-all duration-200
        left-0 md:left-[250px] ${sidebarCollapsed ? 'md:left-[60px]' : 'md:left-[250px]'}`}
    >
      {/* Left: hamburger (mobile) + home logo */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-zinc-50 text-zinc-500 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <button
          onClick={() => navigate('/employee')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors group"
          aria-label="Go home"
        >
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">T</div>
          <span className="font-semibold text-[13px] text-zinc-900 hidden sm:inline">TIRTAM</span>
          <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-100 text-zinc-500 font-semibold uppercase tracking-wider hidden sm:inline">OS</span>
        </button>
      </div>

      <div className="flex items-center gap-3 flex-1 max-w-md ml-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            onFocus={() => navigate('/search')}
            className="w-full pl-10 pr-4 py-2 text-[13px] bg-zinc-50 border border-zinc-100 rounded-lg
              focus:outline-none focus:border-zinc-300 focus:bg-white transition-all placeholder:text-zinc-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 ml-2">
        <button
          onClick={() => navigate('/activity')}
          className="relative p-2 rounded-lg hover:bg-zinc-50 text-zinc-400 transition-colors"
        >
          <Bell size={18} />
          {recentCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-zinc-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {recentCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white text-[13px] font-medium rounded-lg
            hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>
    </header>
  );
}
