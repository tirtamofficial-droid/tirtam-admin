import { useState } from 'react';
import { useStore } from '../store/useStore';
import { departmentIcons, departments, getCompletionPercentage, isOverdue, priorityColors, sortTasks, statusOrder, type TaskSortDir, type TaskSortKey } from '../utils/helpers';
import TaskTable from '../components/TaskTable';
import FilterBar from '../components/FilterBar';
import SortBar from '../components/SortBar';
import type { Department, Task, TaskStatus, ViewMode } from '../types';
import { Table, Clock, CheckCircle2, Flame, Plus, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

const statusColors: Record<TaskStatus, string> = {
  'Not started': 'bg-zinc-100 text-zinc-600',
  'In Progress': 'bg-blue-50 text-blue-700',
  'Blocked': 'bg-red-50 text-red-600',
  'Review': 'bg-amber-50 text-amber-700',
  'Completed': 'bg-green-50 text-green-700',
};

const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'table', label: 'Table', icon: <Table size={14} /> },
  { id: 'pending', label: 'Not started', icon: <Clock size={14} /> },
  { id: 'high-priority', label: 'High Priority', icon: <Flame size={14} /> },
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

// ── Confirm complete dialog ───────────────────────────────────────────────────
function ConfirmCompleteDialog({
  task,
  onConfirm,
  onCancel,
}: {
  task: Task;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center sm:p-4 animate-fade-in" onClick={onCancel}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-float w-full sm:max-w-sm border border-zinc-100 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[16px] font-semibold text-zinc-900">Mark as completed?</h3>
        <p className="text-[13px] text-zinc-500 mt-2 leading-relaxed">
          Are you sure you want to mark <span className="font-medium text-zinc-700">"{task.name}"</span> as completed?
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            Mark completed
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Column header row ─────────────────────────────────────────────────────────
function TableHeader() {
  return (
    <div className="hidden lg:flex items-center w-full px-4 py-2 border-b border-zinc-100 bg-zinc-50/60 gap-2">
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
      <span className="w-28 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 text-right">
        Actions
      </span>
    </div>
  );
}

// ── Unified task list row used across all three sections ─────────────────────
type TaskRowVariant = 'in-progress' | 'upcoming' | 'completed';

function TaskRow({
  task,
  variant = 'upcoming',
  onRequestComplete,
}: {
  task: Task;
  variant?: TaskRowVariant;
  onRequestComplete: () => void;
}) {
  const { setEditingTask, setTaskModalOpen, employees } = useStore();
  const isCompleted = task.status === 'Completed';
  const isUpcoming = variant === 'upcoming';
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

  const openTask = () => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const rowCls = isInProgress
    ? 'bg-green-50/30 hover:bg-green-50/60 border-l-4 border-l-green-400'
    : isCompleted
    ? 'bg-zinc-50/50 hover:bg-zinc-50 border-l-4 border-l-zinc-100'
    : 'hover:bg-zinc-50 border-l-4 border-l-zinc-200';

  const statusBadge = (
    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${statusColors[task.status]}`}>
      {task.status}
    </span>
  );

  const markCompleteButton = !isCompleted ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRequestComplete();
      }}
      className="text-[11px] font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
    >
      Mark complete
    </button>
  ) : null;

  return (
    <div className={`w-full px-4 py-2.5 border-b border-zinc-50 last:border-0 transition-colors ${rowCls}`}>
      {/* Mobile: stacked layout */}
      <div className="lg:hidden space-y-1.5">
        <button
          onClick={openTask}
          className="w-full text-left"
        >
          <p className={`font-medium text-[13px] leading-snug ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
            {task.name}
          </p>
          {task.description ? (
            <p className="text-[12px] text-zinc-400 mt-1 leading-snug line-clamp-2">
              {task.description}
            </p>
          ) : isUpcoming ? (
            <p className="text-[12px] text-purple-500 mt-1">Tap to assign owner and fill details</p>
          ) : null}
        </button>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {hasOwner ? (
            <span className="text-[12px] text-zinc-500">{ownerFirstName}</span>
          ) : (
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              Unassigned
            </span>
          )}
          {statusBadge}
          <span className={`text-[12px] ${overdue && !isCompleted ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
            {dueDateStr}
          </span>
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${pc.bg} ${pc.text}`}>
            {task.priority}
          </span>
          {markCompleteButton}
        </div>
      </div>

      {/* Desktop: table row layout */}
      <div className="hidden lg:flex items-center w-full gap-2">
        <button
          onClick={openTask}
          className={`flex-1 min-w-0 text-left ${isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}
        >
          <p className="font-medium text-[13px] truncate">{task.name}</p>
          {isUpcoming && !task.description && (
            <p className="text-[11px] text-purple-500 truncate mt-0.5">Click to assign owner and fill details</p>
          )}
        </button>

        <span className="w-36 text-zinc-400 text-[12px] truncate pr-2">
          {task.description || (isUpcoming ? '—' : '—')}
        </span>

        <span className="w-24 text-[12px] truncate">
          {hasOwner ? (
            <span className="text-zinc-500">{ownerFirstName}</span>
          ) : (
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              Unassigned
            </span>
          )}
        </span>

        <span className="w-28">{statusBadge}</span>

        <span className={`w-20 text-[12px] text-right ${overdue && !isCompleted ? 'text-red-500 font-medium' : 'text-zinc-400'}`}>
          {dueDateStr}
        </span>

        <span className="w-16 flex justify-end">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${pc.bg} ${pc.text}`}>
            {task.priority}
          </span>
        </span>

        <span className="w-28 flex justify-end">
          {markCompleteButton}
        </span>
      </div>
    </div>
  );
}

// ── Main sectioned view ───────────────────────────────────────────────────────
function SectionedView({ tasks }: { tasks: Task[] }) {
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [confirmCompleteTask, setConfirmCompleteTask] = useState<Task | null>(null);
  const { updateTask } = useStore();

  // Owner-based sectioning
  const inProgress = tasks
    .filter((t) => t.status !== 'Completed' && t.owner && t.owner.trim() !== '')
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  const upcoming = tasks.filter(
    (t) => t.status !== 'Completed' && (!t.owner || t.owner.trim() === '')
  );
  const completed = tasks
    .filter((t) => t.status === 'Completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const visibleCompleted = showAllCompleted ? completed : completed.slice(0, 3);

  return (
    <div className="space-y-6">
      {confirmCompleteTask && (
        <ConfirmCompleteDialog
          task={confirmCompleteTask}
          onConfirm={() => {
            updateTask(confirmCompleteTask.id, { status: 'Completed' });
            setConfirmCompleteTask(null);
          }}
          onCancel={() => setConfirmCompleteTask(null)}
        />
      )}
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
            <p className="text-[12px] text-zinc-400">No tasks in progress — assign an owner to a not started task to move it here</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden w-full">
            <TableHeader />
            {inProgress.map((task) => (
              <TaskRow key={task.id} task={task} variant="in-progress" onRequestComplete={() => setConfirmCompleteTask(task)} />
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
              <TaskRow key={task.id} task={task} variant="upcoming" onRequestComplete={() => setConfirmCompleteTask(task)} />
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
              <TaskRow key={task.id} task={task} variant="completed" onRequestComplete={() => setConfirmCompleteTask(task)} />
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
  const { activeDepartment, setActiveDepartment, activeView, setActiveView, getFilteredTasks, setTaskModalOpen, tasks, employees } = useStore();
  const [sortKey, setSortKey] = useState<TaskSortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<TaskSortDir>('desc');

  if (!activeDepartment) {
    return <DepartmentGrid onSelect={(dept) => setActiveDepartment(dept)} />;
  }

  const allDeptTasks = tasks.filter((t) => t.department === activeDepartment);
  let filtered = getFilteredTasks(activeDepartment);

  switch (activeView) {
    case 'pending': filtered = filtered.filter((t) => t.status === 'Not started'); break;
    case 'high-priority': filtered = filtered.filter((t) => t.priority === 'Critical' || t.priority === 'High'); break;
    case 'completed': filtered = filtered.filter((t) => t.status === 'Completed'); break;
  }

  const getOwnerName = (id: string) => employees.find((e) => e.id === id)?.name || '';
  const displayTasks = sortTasks(filtered, sortKey, sortDir, getOwnerName);

  const completion = getCompletionPercentage(allDeptTasks);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-50 rounded-lg border border-zinc-100 w-full sm:flex sm:flex-nowrap sm:w-auto sm:max-w-none">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-[12px] font-medium transition-all
              ${activeView === v.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            {v.icon}
            <span className="truncate">{v.id === 'high-priority' ? 'High Pri.' : v.label}</span>
          </button>
        ))}
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

      {activeView === 'table' ? (
        <SectionedView tasks={displayTasks} />
      ) : (
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <TaskTable tasks={displayTasks} enableHeaderSort={false} />
        </div>
      )}
    </div>
  );
}
