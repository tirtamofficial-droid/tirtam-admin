import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { isOverdue, isDueToday, isDueThisWeek, formatDate, statusColors, priorityColors, getCompletionPercentage } from '../utils/helpers';
import type { Task, Priority } from '../types';
import { Clock, AlertTriangle, CheckCircle2, Flame, CalendarDays, TrendingUp, ListTodo } from 'lucide-react';

const priorityOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function sortCurrentTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a) ? 0 : 1;
    const bOverdue = isOverdue(b) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    const aToday = isDueToday(a) ? 0 : 1;
    const bToday = isDueToday(b) ? 0 : 1;
    if (aToday !== bToday) return aToday - bToday;

    const pri = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pri !== 0) return pri;

    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

export default function EmployeeDashboard() {
  const { tasks, employees, activities, setEditingTask, setTaskModalOpen } = useStore();
  const { profile } = useAuth();
  const currentUser = profile ? { ...profile, department: profile.department as any } : employees[0];
  const myTasks = tasks.filter((t) => t.owner === currentUser.id);
  const myActive = myTasks.filter((t) => t.status !== 'Completed');
  const myCurrentTasks = sortCurrentTasks(myActive);
  const myOverdue = myTasks.filter((t) => isOverdue(t));
  const myToday = myActive.filter((t) => isDueToday(t));
  const myThisWeek = myActive.filter((t) => isDueThisWeek(t));
  const myCompleted = myTasks.filter((t) => t.status === 'Completed');
  const myHighPriority = myActive.filter((t) => t.priority === 'Critical' || t.priority === 'High');
  const completionRate = getCompletionPercentage(myTasks);

  const myRecentActivity = activities.filter((a) => a.userId === currentUser.id).slice(0, 5);

  const openTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const taskHighlight = (task: Task) => {
    if (isOverdue(task)) return 'border-l-red-500 bg-red-50/40 hover:bg-red-50/70';
    if (isDueToday(task)) return 'border-l-amber-500 bg-amber-50/40 hover:bg-amber-50/70';
    if (task.status === 'Pending') return 'border-l-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/50';
    return 'border-l-zinc-300 bg-white hover:bg-zinc-50/80';
  };

  const stats = [
    { label: 'Active Tasks', value: myActive.length, icon: <TrendingUp size={16} />, color: 'text-zinc-600', bg: 'bg-zinc-50' },
    { label: 'Due Today', value: myToday.length, icon: <CalendarDays size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: myOverdue.length, icon: <AlertTriangle size={16} />, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Completed', value: myCompleted.length, icon: <CheckCircle2 size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-white text-lg font-bold">
          {currentUser.avatar}
        </div>
        <div>
          <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight">My Dashboard</h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">
            {currentUser.name.split(' ')[0]} · {currentUser.role} · {completionRate}% complete
          </p>
        </div>
      </div>

      {/* Your Current Tasks — primary focus */}
      <section className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 via-white to-white shadow-[0_4px_24px_rgba(99,102,241,0.08)] overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-100/80 bg-indigo-600/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <ListTodo size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold text-zinc-900">Your Current Tasks</h2>
              <p className="text-[12px] text-indigo-600/80 mt-0.5">Pending & active work assigned to you</p>
            </div>
          </div>
          <span className="flex-shrink-0 text-[12px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
            {myCurrentTasks.length} open
          </span>
        </div>

        <div className="p-4 space-y-2">
          {myCurrentTasks.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <p className="text-[14px] font-medium text-zinc-600">You're all caught up!</p>
              <p className="text-[12px] text-zinc-400 mt-1">No pending tasks right now</p>
            </div>
          ) : (
            myCurrentTasks.map((task) => {
              const overdue = isOverdue(task);
              const dueToday = isDueToday(task);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTask(task)}
                  className={`w-full text-left rounded-xl border border-zinc-100 border-l-4 px-4 py-3 transition-all ${taskHighlight(task)}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className={`text-[14px] font-semibold leading-snug ${overdue ? 'text-red-700' : 'text-zinc-900'}`}>
                        {task.name}
                      </p>
                      {task.description && (
                        <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <p className="text-[11px] text-zinc-400 mt-1.5">{task.department}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end sm:flex-shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                        {task.priority}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColors[task.status].dot}`} />
                        {task.status}
                      </span>
                      <span className={`text-[11px] font-medium ${overdue ? 'text-red-600' : dueToday ? 'text-amber-600' : 'text-zinc-500'}`}>
                        {overdue ? 'Overdue · ' : dueToday ? 'Due today · ' : ''}{formatDate(task.deadline)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-[24px] font-bold text-zinc-900 mt-1 tracking-tight">{s.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-amber-500" /> Due Today & High Priority
          </h2>
          {myToday.length === 0 && myHighPriority.length === 0 ? (
            <p className="text-[13px] text-zinc-400 py-6 text-center">Nothing urgent today</p>
          ) : (
            <div className="space-y-2">
              {[...myToday, ...myHighPriority.filter((t) => !myToday.includes(t))].slice(0, 6).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTask(task)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                      {task.priority}
                    </span>
                    <span className="text-[13px] text-zinc-700 truncate">{task.name}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                    <span className={`w-1 h-1 rounded-full ${statusColors[task.status].dot}`}></span>
                    {task.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Overdue Work
          </h2>
          {myOverdue.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-zinc-400">
              <CheckCircle2 size={28} className="text-emerald-400 mb-2" />
              <p className="text-[13px] font-medium">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myOverdue.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openTask(task)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-red-50/60 border border-red-100 text-left hover:bg-red-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-red-700">{task.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{task.department}</p>
                  </div>
                  <span className="text-[11px] text-red-500 font-medium flex-shrink-0">Due {formatDate(task.deadline)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-blue-500" /> Upcoming Deadlines
          </h2>
          <div className="space-y-2">
            {myThisWeek.slice(0, 6).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-700 truncate">{task.name}</p>
                  <p className="text-[11px] text-zinc-400">{task.department}</p>
                </div>
                <span className="text-[11px] text-zinc-500 flex-shrink-0">{formatDate(task.deadline)}</span>
              </button>
            ))}
            {myThisWeek.length === 0 && (
              <p className="text-[13px] text-zinc-400 py-6 text-center">No deadlines this week</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Flame size={16} className="text-purple-500" /> My Recent Activity
          </h2>
          <div className="space-y-2">
            {myRecentActivity.map((act) => (
              <div key={act.id} className="flex items-center gap-2.5 py-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  act.action === 'completed' ? 'bg-emerald-400' : act.action === 'created' ? 'bg-zinc-400' : 'bg-amber-400'
                }`} />
                <p className="text-[13px] text-zinc-500 flex-1 truncate">{act.details}</p>
                <span className="text-[10px] text-zinc-300 flex-shrink-0">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {myRecentActivity.length === 0 && (
              <p className="text-[13px] text-zinc-400 py-6 text-center">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {myCompleted.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" /> Recently Completed
          </h2>
          <div className="space-y-2">
            {myCompleted.slice(0, 5).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors text-left opacity-70"
              >
                <span className="text-[13px] text-zinc-500 line-through truncate">{task.name}</span>
                <span className="text-[11px] text-zinc-400 flex-shrink-0">{task.department}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
