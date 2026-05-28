import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { departmentIcons, departments, getCompletionPercentage, isOverdue, priorityColors } from '../utils/helpers';
import TaskTable from '../components/TaskTable';
import KanbanBoard from '../components/KanbanBoard';
import FilterBar from '../components/FilterBar';
import type { Department, Task, TaskStatus, ViewMode } from '../types';
import { Table, Columns3, Clock, AlertTriangle, CheckCircle2, Flame, Plus, ArrowLeft, ChevronDown, ChevronUp, Check } from 'lucide-react';

const ALL_STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Blocked', 'Review', 'Completed'];

const statusColors: Record<TaskStatus, string> = {
  'Pending': 'bg-zinc-100 text-zinc-600',
  'In Progress': 'bg-blue-50 text-blue-700',
  'Blocked': 'bg-red-50 text-red-600',
  'Review': 'bg-amber-50 text-amber-700',
  'Completed': 'bg-green-50 text-green-700',
};

const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'table', label: 'Table', icon: <Table size={14} /> },
  { id: 'kanban', label: 'Kanban', icon: <Columns3 size={14} /> },
  { id: 'pending', label: 'Pending', icon: <Clock size={14} /> },
  { id: 'high-priority', label: 'High Priority', icon: <Flame size={14} /> },
  { id: 'overdue', label: 'Overdue', icon: <AlertTriangle size={14} /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={14} /> },
];

function DepartmentGrid({ onSelect }: { onSelect: (dept: Department) => void }) {
  const { tasks } = useStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight">Tasks</h1>
        <p className="text-[13px] text-zinc-400 mt-0.5">Select a department to view and manage its tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const deptTasks = tasks.filter((t) => t.department === dept);
          const total = deptTasks.length;
          const active = deptTasks.filter((t) => t.status !== 'Completed').length;
          const completed = deptTasks.filter((t) => t.status === 'Completed').length;
          const pct = getCompletionPercentage(deptTasks);

          return (
            <button
              key={dept}
              onClick={() => onSelect(dept)}
              className="bg-white rounded-xl border border-zinc-100 p-5 text-left transition-all duration-150
                shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]
                hover:border-zinc-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{departmentIcons[dept]}</span>
                <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">
                  {total} {total === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <h3 className="text-[15px] font-semibold text-zinc-900 tracking-tight mb-3 group-hover:text-zinc-700 transition-colors">
                {dept}
              </h3>

              <div className="flex items-center gap-4 text-[12px] text-zinc-400 mb-3">
                <span>{active} active</span>
                <span className="w-px h-3 bg-zinc-200" />
                <span>{completed} done</span>
              </div>

              <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">{pct}% complete</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Column header row ─────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <div className="flex items-center w-full px-4 py-2 border-b border-zinc-100 bg-zinc-50/60 gap-2">
      {/* Quick-complete spacer */}
      <span className="w-6 flex-shrink-0" />
      <span className="flex-1 min-w-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Task
      </span>
      <span className="w-36 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hidden lg:block">
        Description
      </span>
      <span className="w-24 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Owner
      </span>
      <span className="w-28 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        Status
      </span>
      <span className="w-20 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-right">
        Due
      </span>
      <span className="w-16 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-right">
        Priority
      </span>
    </div>
  );
}

// ── Unified task list row used across all three sections ─────────────────────
type TaskRowVariant = 'in-progress' | 'upcoming' | 'completed';

function TaskRow({
  task,
  variant = 'upcoming',
  openDropdownId,
  setOpenDropdownId,
}: {
  task: Task;
  variant?: TaskRowVariant;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}) {
  const { setEditingTask, setTaskModalOpen, employees, updateTask } = useStore();
  const isCompleted = task.status === 'Completed';
  const isInProgress = variant === 'in-progress';
  const overdue = isOverdue(task);
  const pc = priorityColors[task.priority];
  const hasOwner = task.owner && task.owner.trim() !== '';
  const ownerFirstName = hasOwner
    ? (employees.find((e) => e.id === task.owner)?.name.split(' ')[0] || '')
    : '';
  const dueDateStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDropdownOpen = openDropdownId === task.id;

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, setOpenDropdownId]);

  const rowCls = isInProgress
    ? 'bg-green-50/30 hover:bg-green-50/60 border-l-4 border-l-green-400'
    : isCompleted
    ? 'bg-zinc-50/50 hover:bg-zinc-50 border-l-4 border-l-zinc-100'
    : 'hover:bg-zinc-50 border-l-4 border-l-zinc-200';

  return (
    <div className={`flex items-center w-full px-4 py-2.5 border-b border-zinc-50 last:border-0 transition-colors ${rowCls} gap-2`}>
      {/* Quick-complete circle */}
      <button
        onClick={() => updateTask(task.id, { status: isCompleted ? 'Pending' : 'Completed' })}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
          ${isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-zinc-300 hover:border-green-500 bg-transparent'
          }`}
        title={isCompleted ? 'Mark as pending' : 'Mark as complete'}
      >
        {isCompleted && <Check size={10} strokeWidth={3} className="text-white" />}
      </button>

      {/* Task name — opens modal on click */}
      <button
        onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
        className={`flex-1 min-w-0 font-medium text-[13px] truncate text-left ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}
      >
        {task.name}
      </button>

      {/* Description */}
      <span className="w-36 text-zinc-400 text-[12px] truncate hidden lg:block pr-2">
        {task.description || '—'}
      </span>

      {/* Owner */}
      <span className="w-24 text-[12px] truncate">
        {hasOwner ? (
          <span className="text-zinc-500">{ownerFirstName}</span>
        ) : (
          <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
            Unassigned
          </span>
        )}
      </span>

      {/* Status badge + dropdown */}
      <div className="w-28 relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(isDropdownOpen ? null : task.id);
          }}
          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium w-full justify-center truncate transition-opacity hover:opacity-80 ${statusColors[task.status]}`}
        >
          {task.status}
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-zinc-100 rounded-lg shadow-lg py-1 min-w-[130px]">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  updateTask(task.id, { status: s });
                  setOpenDropdownId(null);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2
                  ${task.status === s ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
              >
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusColors[s]}`}>
                  {s}
                </span>
                {task.status === s && <Check size={10} strokeWidth={3} className="text-zinc-400 ml-auto" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due date */}
      <span className={`w-20 text-[12px] text-right ${overdue && !isCompleted ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
        {dueDateStr}
      </span>

      {/* Priority badge */}
      <span className="w-16 flex justify-end">
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${pc.bg} ${pc.text}`}>
          {task.priority}
        </span>
      </span>
    </div>
  );
}

// ── Main sectioned view ───────────────────────────────────────────────────────
function SectionedView({ tasks }: { tasks: Task[] }) {
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Owner-based sectioning
  const inProgress = tasks.filter(
    (t) => t.status !== 'Completed' && t.owner && t.owner.trim() !== ''
  );
  const upcoming = tasks.filter(
    (t) => t.status !== 'Completed' && (!t.owner || t.owner.trim() === '')
  );
  const completed = tasks
    .filter((t) => t.status === 'Completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const visibleCompleted = showAllCompleted ? completed : completed.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* ── In Progress ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[15px]">🟢</span>
          <h2 className="text-[13px] font-semibold text-zinc-700">In Progress</h2>
          <span className="text-[11px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md">
            {inProgress.length}
          </span>
        </div>

        {inProgress.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl py-5 text-center">
            <p className="text-[12px] text-zinc-400">No tasks in progress — assign an owner to a pending task to move it here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden w-full">
            <TableHeader />
            {inProgress.map((task) => (
              <TaskRow key={task.id} task={task} variant="in-progress" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
            ))}
          </div>
        )}
      </div>

      {/* ── Upcoming ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[15px]">📋</span>
          <h2 className="text-[13px] font-semibold text-zinc-700">Upcoming</h2>
          <span className="text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md">
            {upcoming.length}
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl py-5 text-center">
            <p className="text-[12px] text-zinc-400">All tasks have been assigned</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden w-full">
            <TableHeader />
            {upcoming.map((task) => (
              <TaskRow key={task.id} task={task} variant="upcoming" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
            ))}
          </div>
        )}
      </div>

      {/* ── Completed ───────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[15px]">✅</span>
          <h2 className="text-[13px] font-semibold text-zinc-700">Completed</h2>
          {completed.length > 0 && (
            <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">
              {completed.length}
            </span>
          )}
        </div>

        {completed.length === 0 ? (
          <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-xl py-5 text-center">
            <p className="text-[12px] text-zinc-400">No completed tasks yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden w-full">
            <TableHeader />
            {visibleCompleted.map((task) => (
              <TaskRow key={task.id} task={task} variant="completed" openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
            ))}

            {completed.length > 3 && (
              <div className="border-t border-zinc-50 px-4 py-2.5">
                <button
                  onClick={() => setShowAllCompleted(!showAllCompleted)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  {showAllCompleted ? (
                    <><ChevronUp size={13} /> Show fewer</>
                  ) : (
                    <><ChevronDown size={13} /> Show all {completed.length} completed tasks</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DepartmentPage() {
  const { activeDepartment, setActiveDepartment, activeView, setActiveView, getFilteredTasks, setTaskModalOpen, tasks } = useStore();

  if (!activeDepartment) {
    return <DepartmentGrid onSelect={(dept) => setActiveDepartment(dept)} />;
  }

  const allDeptTasks = tasks.filter((t) => t.department === activeDepartment);
  let filtered = getFilteredTasks(activeDepartment);

  switch (activeView) {
    case 'pending': filtered = filtered.filter((t) => t.status === 'Pending'); break;
    case 'high-priority': filtered = filtered.filter((t) => t.priority === 'Critical' || t.priority === 'High'); break;
    case 'overdue': filtered = filtered.filter((t) => isOverdue(t)); break;
    case 'completed': filtered = filtered.filter((t) => t.status === 'Completed'); break;
  }

  const completion = getCompletionPercentage(allDeptTasks);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveDepartment(null)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            title="All Departments"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-2xl">{departmentIcons[activeDepartment]}</span>
          <div>
            <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight">{activeDepartment}</h1>
            <p className="text-[13px] text-zinc-400">{allDeptTasks.length} tasks · {completion}% complete</p>
          </div>
        </div>
        <button
          onClick={() => setTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 bg-zinc-50 rounded-lg w-fit border border-zinc-100">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all
              ${activeView === v.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      <FilterBar />

      {activeView === 'table' ? (
        <SectionedView tasks={filtered} />
      ) : activeView === 'kanban' ? (
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden p-4">
          <KanbanBoard tasks={filtered} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <TaskTable tasks={filtered} />
        </div>
      )}
    </div>
  );
}
