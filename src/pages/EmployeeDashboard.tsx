import { useStore } from '../store/useStore';
import { useAuth } from '../lib/auth';
import { isOverdue, isDueToday, isDueThisWeek, formatDate, statusColors, priorityColors, getCompletionPercentage } from '../utils/helpers';
import { Clock, AlertTriangle, CheckCircle2, Flame, CalendarDays, TrendingUp } from 'lucide-react';

export default function EmployeeDashboard() {
  const { tasks, employees, activities } = useStore();
  const { profile } = useAuth();
  const currentUser = profile ? { ...profile, department: profile.department as any } : employees[0];
  const myTasks = tasks.filter((t) => t.owner === currentUser.id);
  const myActive = myTasks.filter((t) => t.status !== 'Completed');
  const myOverdue = myTasks.filter((t) => isOverdue(t));
  const myToday = myActive.filter((t) => isDueToday(t));
  const myThisWeek = myActive.filter((t) => isDueThisWeek(t));
  const myCompleted = myTasks.filter((t) => t.status === 'Completed');
  const myHighPriority = myActive.filter((t) => t.priority === 'Critical' || t.priority === 'High');
  const completionRate = getCompletionPercentage(myTasks);

  const myRecentActivity = activities.filter((a) => a.userId === currentUser.id).slice(0, 5);

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
          <h1 className="text-[20px] font-semibold text-zinc-900 tracking-tight">Welcome, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-[13px] text-zinc-400 mt-0.5">{currentUser.role} · {currentUser.department} · {completionRate}% completion</p>
        </div>
      </div>

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
            <CalendarDays size={16} className="text-amber-500" /> Today's Priorities
          </h2>
          {myToday.length === 0 && myHighPriority.length === 0 ? (
            <p className="text-[13px] text-zinc-400 py-6 text-center">No urgent tasks for today</p>
          ) : (
            <div className="space-y-2">
              {[...myToday, ...myHighPriority.filter((t) => !myToday.includes(t))].slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
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
                </div>
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
                <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/60 border border-red-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-red-700">{task.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{task.department}</p>
                  </div>
                  <span className="text-[11px] text-red-500 font-medium flex-shrink-0">Due {formatDate(task.deadline)}</span>
                </div>
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
              <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-700 truncate">{task.name}</p>
                  <p className="text-[11px] text-zinc-400">{task.department}</p>
                </div>
                <span className="text-[11px] text-zinc-500 flex-shrink-0">{formatDate(task.deadline)}</span>
              </div>
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

      <div className="bg-white rounded-xl border border-zinc-100 p-6">
        <h2 className="text-[15px] font-semibold text-zinc-900 mb-4">All My Tasks</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2.5">Task</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2.5">Department</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2.5">Priority</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2.5">Status</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-2.5">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {myTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <tr key={task.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <p className={`text-[13px] font-medium ${overdue ? 'text-red-600' : 'text-zinc-800'}`}>{task.name}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[12px] text-zinc-400">{task.department}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                        <span className={`w-1 h-1 rounded-full ${statusColors[task.status].dot}`}></span>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[12px] ${overdue ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>{formatDate(task.deadline)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
