import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import type { Task, Department, TaskStatus, Priority } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(task: Task): boolean {
  return task.status !== 'Completed' && isPast(new Date(task.deadline));
}

export function isDueToday(task: Task): boolean {
  return isToday(new Date(task.deadline));
}

export function isDueTomorrow(task: Task): boolean {
  return isTomorrow(new Date(task.deadline));
}

export function isDueThisWeek(task: Task): boolean {
  const deadline = new Date(task.deadline);
  const weekFromNow = addDays(new Date(), 7);
  return deadline <= weekFromNow && deadline >= new Date();
}

export const statusColors: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  'Pending': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Blocked': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Review': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export const priorityColors: Record<Priority, { bg: string; text: string }> = {
  'Critical': { bg: 'bg-red-100', text: 'text-red-800' },
  'High': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Medium': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Low': { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export const departmentIcons: Record<Department, string> = {
  'Packaging & Product': '📦',
  'Technology': '💻',
  'Marketing & Branding': '📣',
  'Legal & Finance': '⚖️',
  'Operations & Logistics': '🚚',
  'Vendor & Procurement': '🤝',
  'Website': '🌐',
};

export const departments: Department[] = [
  'Packaging & Product',
  'Technology',
  'Marketing & Branding',
  'Legal & Finance',
  'Operations & Logistics',
  'Vendor & Procurement',
  'Website',
];

export const statuses: TaskStatus[] = ['Pending', 'In Progress', 'Blocked', 'Review', 'Completed'];
export const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export type TaskSortKey = 'name' | 'priority' | 'status' | 'deadline' | 'owner' | 'updatedAt';
export type TaskSortDir = 'asc' | 'desc';

const priorityOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const statusOrder: Record<TaskStatus, number> = { Pending: 0, 'In Progress': 1, Blocked: 2, Review: 3, Completed: 4 };

export function sortTasks(
  tasks: Task[],
  sortKey: TaskSortKey,
  sortDir: TaskSortDir,
  getOwnerName: (id: string) => string = () => ''
): Task[] {
  return [...tasks].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'priority': cmp = priorityOrder[a.priority] - priorityOrder[b.priority]; break;
      case 'status': cmp = statusOrder[a.status] - statusOrder[b.status]; break;
      case 'deadline': cmp = new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); break;
      case 'owner': cmp = getOwnerName(a.owner).localeCompare(getOwnerName(b.owner)); break;
      case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

export const taskSortOptions: { key: TaskSortKey; label: string }[] = [
  { key: 'updatedAt', label: 'Updated' },
  { key: 'name', label: 'Name' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'owner', label: 'Owner' },
];

export function getCompletionPercentage(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'Completed').length;
  return Math.round((completed / tasks.length) * 100);
}

export function generateWhatsAppSummary(tasks: Task[], employees: { id: string; name: string }[]): string {
  const getOwnerName = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name.split(' ')[0] : '';
  };

  const hasOwner = (t: Task) => t.owner && t.owner.trim() !== '';
  const todayTasks = tasks.filter(
    (t) => t.status !== 'Completed' && hasOwner(t) && isDueToday(t)
  );

  const priorityIcon = (p: string) => {
    if (p === 'Critical' || p === 'High') return '🔴';
    if (p === 'Medium') return '🟡';
    return '🟢';
  };

  const dateStr = format(new Date(), 'EEEE, MMMM d');
  let msg = `📅 *Tirtam — Today's Tasks*\n${dateStr}\n\n`;
  msg += `📋 *Tasks due today:* ${todayTasks.length}\n`;

  if (todayTasks.length === 0) {
    msg += `\nNo tasks due today.`;
  } else {
    const sorted = [...todayTasks].sort((a, b) => {
      const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
    });

    for (const t of sorted) {
      const icon = priorityIcon(t.priority);
      msg += `\n---\n\n`;
      msg += `${icon} *Owner:* ${getOwnerName(t.owner)}\n`;
      msg += `*Task:* ${t.name}\n`;
      msg += `*Department:* ${t.department}\n`;
      msg += `*Priority:* ${t.priority}\n`;
      msg += `*Status:* ${t.status}`;
    }
  }

  msg += `\n\n---\n\n_Sent by Tirtam OS_`;
  return msg;
}
