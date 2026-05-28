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
  const assignedTasks = tasks.filter(hasOwner);
  const unassigned = tasks.filter((t) => !hasOwner(t));

  const now = new Date();

  const pending = assignedTasks.filter((t) => t.status === 'Pending');
  const completed = assignedTasks.filter((t) => t.status === 'Completed');
  const active = assignedTasks.filter((t) => t.status !== 'Completed');

  const highPriority = active.filter((t) => t.priority === 'Critical' || t.priority === 'High');
  const mediumPriority = active.filter((t) => t.priority === 'Medium');
  const lowPriority = active.filter((t) => t.priority === 'Low');

  const formatDueDate = (deadline: string) => {
    if (!deadline) return 'No date';
    const dl = new Date(deadline);
    if (isPast(dl)) return 'Overdue';
    return format(dl, 'MMMM d');
  };

  const priorityIcon = (p: string) => {
    if (p === 'Critical' || p === 'High') return '🔴';
    if (p === 'Medium') return '🟡';
    return '🟢';
  };

  let msg = `⚠️ *Tirtam Daily Operations Summary*\n\n`;
  msg += `📌 Pending Tasks: ${pending.length}\n`;
  msg += `✅ Completed Tasks: ${completed.length}\n`;
  msg += `🔴 High Priority: ${highPriority.length}\n`;
  msg += `🟡 Medium Priority: ${mediumPriority.length}\n`;
  msg += `🟢 Low Priority: ${lowPriority.length}\n`;

  const sorted = [...active].sort((a, b) => {
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
    msg += `*Due Date:* ${formatDueDate(t.deadline)}\n`;
    msg += `*Status:* ${t.status}`;
  }

  if (unassigned.length > 0) {
    msg += `\n\n---\n\n📋 *Upcoming Tasks (Unassigned):* ${unassigned.length}\n`;
    for (const t of unassigned) {
      msg += `\n• ${t.name} — ${t.department} [${t.priority}]`;
    }
  }

  msg += `\n\n---\n\n_Sent by Tirtam OS_`;
  return msg;
}
