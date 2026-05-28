import { useStore } from '../store/useStore';
import { departments, departmentIcons, getCompletionPercentage, isOverdue, priorityColors, formatDate } from '../utils/helpers';
import { AlertTriangle, Clock, CheckCircle2, Flame, TrendingUp, BarChart3, Users, Target, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FounderDashboard() {
  const { tasks, employees, activities, setActiveDepartment } = useStore();
  const navigate = useNavigate();

  const hasOwner = (t: typeof tasks[0]) => t.owner && t.owner.trim() !== '';
  const unassignedTasks = tasks.filter((t) => !hasOwner(t));
  const assignedTasks = tasks.filter(hasOwner);
  const activeTasks = assignedTasks.filter((t) => t.status !== 'Completed');
  const pending = assignedTasks.filter((t) => t.status === 'Pending');
  const inProgress = assignedTasks.filter((t) => t.status === 'In Progress');
  const blocked = assignedTasks.filter((t) => t.status === 'Blocked');
  const review = assignedTasks.filter((t) => t.status === 'Review');
  const completed = assignedTasks.filter((t) => t.status === 'Completed');
  const overdue = assignedTasks.filter((t) => isOverdue(t));
  const highPriority = activeTasks.filter((t) => t.priority === 'Critical' || t.priority === 'High');
  const completionRate = getCompletionPercentage(assignedTasks);

  const ownerWorkload = employees.map((emp) => ({
    ...emp,
    taskCount: activeTasks.filter((t) => t.owner === emp.id).length,
    completedCount: completed.filter((t) => t.owner === emp.id).length,
  }));

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: <BarChart3 size={18} />, color: 'text-zinc-600', bg: 'bg-zinc-50' },
    { label: 'Pending', value: pending.length, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: inProgress.length, icon: <TrendingUp size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Blocked', value: blocked.length, icon: <AlertTriangle size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'In Review', value: review.length, icon: <Target size={18} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Overdue', value: overdue.length, icon: <Flame size={18} />, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Completed', value: completed.length, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Unassigned', value: unassignedTasks.length, icon: <Inbox size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Execution', value: `${completionRate}%`, icon: <Users size={18} />, color: 'text-zinc-600', bg: 'bg-zinc-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[22px] font-semibold text-zinc-900 tracking-tight">Founder Dashboard</h1>
        <p className="text-[13px] text-zinc-400 mt-1">Operational command center</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-zinc-100 p-4 hover:shadow-card transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-[26px] font-bold text-zinc-900 mt-1 tracking-tight">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-5">Department Progress</h2>
          <div className="space-y-5">
            {departments.map((dept) => {
              const deptTasks = tasks.filter((t) => t.department === dept);
              const pct = getCompletionPercentage(deptTasks);
              const active = deptTasks.filter((t) => t.status !== 'Completed').length;
              const od = deptTasks.filter((t) => isOverdue(t)).length;
              return (
                <div
                  key={dept}
                  className="cursor-pointer hover:bg-zinc-50 rounded-lg p-2.5 -mx-2.5 transition-colors"
                  onClick={() => { setActiveDepartment(dept); navigate('/department'); }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{departmentIcons[dept]}</span>
                      <span className="text-[13px] font-medium text-zinc-800">{dept}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{active} active</span>
                      {od > 0 && <span className="text-red-500 font-medium">{od} overdue</span>}
                      <span className="font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-5">Workload</h2>
          <div className="space-y-4">
            {ownerWorkload.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {emp.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-zinc-800 truncate">{emp.name}</span>
                    <span className="text-[12px] text-zinc-400 font-medium">{emp.taskCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-zinc-400 rounded-full"
                      style={{ width: `${Math.min((emp.taskCount / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Blockers
          </h2>
          {blocked.length === 0 ? (
            <p className="text-[13px] text-zinc-400 py-4 text-center">No blocked tasks</p>
          ) : (
            <div className="space-y-2">
              {blocked.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50/60 border border-red-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-800">{task.name}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{task.department}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Flame size={16} className="text-orange-500" /> High Priority
          </h2>
          {highPriority.length === 0 ? (
            <p className="text-[13px] text-zinc-400 py-4 text-center">No high priority tasks</p>
          ) : (
            <div className="space-y-2">
              {highPriority.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                      {task.priority}
                    </span>
                    <span className="text-[13px] text-zinc-700 truncate">{task.name}</span>
                  </div>
                  <span className={`text-[10px] flex-shrink-0 ml-2 ${isOverdue(task) ? 'text-red-500' : 'text-zinc-400'}`}>
                    {formatDate(task.deadline)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {unassignedTasks.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-100 p-6">
          <h2 className="text-[15px] font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Inbox size={16} className="text-indigo-500" /> Upcoming Tasks
            <span className="text-[11px] font-normal text-zinc-400 ml-1">({unassignedTasks.length} unassigned — not in daily scan)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unassignedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-50 transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                    {task.priority}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-700 truncate">{task.name}</p>
                    <p className="text-[11px] text-zinc-400">{task.department}</p>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-500 font-medium bg-indigo-100 px-2 py-0.5 rounded flex-shrink-0 ml-2">
                  Unassigned
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-100 p-6">
        <h2 className="text-[15px] font-semibold text-zinc-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {activities.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-center gap-3 py-1">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 text-[9px] font-bold flex-shrink-0">
                {employees.find((e) => e.id === act.userId)?.avatar || '?'}
              </div>
              <p className="text-[13px] text-zinc-500 flex-1">
                <span className="font-medium text-zinc-800">{act.userName}</span>{' '}
                {act.details}
              </p>
              <span className="text-[11px] text-zinc-300 flex-shrink-0">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
