import { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { taskSortOptions, type TaskSortDir, type TaskSortKey } from '../utils/helpers';

interface Props {
  sortKey: TaskSortKey;
  sortDir: TaskSortDir;
  onChange: (key: TaskSortKey, dir: TaskSortDir) => void;
}

export default function SortBar({ sortKey, sortDir, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const activeLabel = taskSortOptions.find((o) => o.key === sortKey)?.label || 'Sort';

  const handleOptionClick = (key: TaskSortKey) => {
    if (sortKey === key) {
      onChange(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onChange(key, 'asc');
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors
          ${open
            ? 'bg-white text-zinc-900 border-zinc-200 shadow-sm'
            : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:text-zinc-700 hover:border-zinc-200'
          }`}
      >
        <ArrowUpDown size={14} className="text-zinc-400" />
        Sort
        <span className="text-zinc-400">·</span>
        <span className="text-zinc-700">{activeLabel}</span>
        {sortDir === 'asc' ? <ChevronUp size={12} className="text-zinc-400" /> : <ChevronDown size={12} className="text-zinc-400" />}
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">Sort by</p>
          <div className="flex flex-wrap gap-2">
            {taskSortOptions.map((option) => {
              const isActive = sortKey === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleOptionClick(option.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-colors
                    ${isActive
                      ? 'bg-white text-zinc-900 border-zinc-200 shadow-sm'
                      : 'bg-white/60 text-zinc-500 border-zinc-100 hover:text-zinc-700 hover:border-zinc-200'
                    }`}
                >
                  {option.label}
                  {isActive && (
                    sortDir === 'asc'
                      ? <ChevronUp size={12} className="text-zinc-500" />
                      : <ChevronDown size={12} className="text-zinc-500" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Click again to toggle ascending / descending</p>
        </div>
      )}
    </div>
  );
}
