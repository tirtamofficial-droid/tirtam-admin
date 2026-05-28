import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isYesterday, addDays } from 'date-fns';
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
  'Not started': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
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

export const statuses: TaskStatus[] = ['In Progress', 'Not started', 'Blocked', 'Review', 'Completed'];
export const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

export type TaskSortKey = 'name' | 'priority' | 'status' | 'deadline' | 'owner' | 'updatedAt';
export type TaskSortDir = 'asc' | 'desc';

const priorityOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
export const statusOrder: Record<TaskStatus, number> = { 'In Progress': 0, 'Not started': 1, Blocked: 2, Review: 3, Completed: 4 };

export function compareTasksByStatusThenPriority(a: Task, b: Task): number {
  const statusCmp = statusOrder[a.status] - statusOrder[b.status];
  if (statusCmp !== 0) return statusCmp;
  return priorityOrder[a.priority] - priorityOrder[b.priority];
}

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

function formatFocusDueDate(deadline: string): string {
  if (!deadline) return 'No date';
  const dl = new Date(deadline);
  if (isToday(dl)) return 'TODAY';
  if (isPast(dl)) return 'OVERDUE';
  return `${dl.getDate()} ${format(dl, 'MMMM')}`;
}

function formatStatusWithEmoji(status: TaskStatus): string {
  switch (status) {
    case 'In Progress': return '🔄 In Progress';
    case 'Not started': return '⚠️ Not Started';
    case 'Blocked': return '🚫 Blocked';
    case 'Review': return '👀 Review';
    case 'Completed': return '✅ Completed';
    default: return status;
  }
}

function wasCompletedYesterday(task: Task): boolean {
  if (task.status !== 'Completed') return false;
  return isYesterday(new Date(task.updatedAt));
}

function isWebsiteTask(task: Task): boolean {
  return task.department === 'Website';
}

function formatTaskFocusBlock(task: Task): string {
  return `📌 ${task.name} · 🏢 ${task.department}\n⏳ Due: ${formatFocusDueDate(task.deadline)} ${formatStatusWithEmoji(task.status)}\n\n`;
}

function formatWebsiteTasksSection(
  websiteTasks: Task[],
  getOwnerFullName: (id: string) => string
): string {
  if (websiteTasks.length === 0) return '';

  const byOwner = new Map<string, Task[]>();
  for (const task of websiteTasks) {
    const list = byOwner.get(task.owner) || [];
    list.push(task);
    byOwner.set(task.owner, list);
  }

  const owners = [...byOwner.entries()].sort((a, b) =>
    getOwnerFullName(a[0]).localeCompare(getOwnerFullName(b[0]))
  );

  let section = `🌐 Website Tasks\n\n`;
  for (const [ownerId, ownerTasks] of owners) {
    section += `👤 ${getOwnerFullName(ownerId)}\n`;
    const sorted = [...ownerTasks].sort(compareTasksByStatusThenPriority);
    for (const task of sorted) {
      section += formatTaskFocusBlock(task);
    }
  }
  return section;
}

export function generateWhatsAppSummary(tasks: Task[], employees: { id: string; name: string; avatar?: string }[]): string {
  const getOwnerFullName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';

  const hasOwner = (t: Task) => t.owner && t.owner.trim() !== '';
  const focusTasks = tasks.filter((t) => hasOwner(t) && t.status !== 'Completed');
  const mainFocusTasks = focusTasks.filter((t) => !isWebsiteTask(t));
  const websiteFocusTasks = focusTasks.filter(isWebsiteTask);
  const upcoming = tasks.filter((t) => !hasOwner(t) && t.status !== 'Completed').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const notStarted = tasks.filter((t) => t.status === 'Not started').length;
  const completedYesterday = tasks.filter(wasCompletedYesterday).length;

  const sorted = [...mainFocusTasks].sort(compareTasksByStatusThenPriority);

  let msg = `⚠️ Tirtam Daily Ops Summary\n\n`;
  msg += `📊 Today's Snapshot\n`;
  msg += `🟡 In Progress: ${inProgress}\n`;
  msg += `⚪ Not Started: ${notStarted}\n`;
  msg += `📋 Upcoming: ${upcoming}\n`;
  msg += `✅ Completed Yesterday: ${completedYesterday}\n\n`;
  msg += `🔥 Today's Focus\n\n`;

  if (sorted.length === 0) {
    msg += `No active tasks assigned.`;
  } else {
    for (const t of sorted) {
      msg += `👤 ${getOwnerFullName(t.owner)}\n`;
      msg += formatTaskFocusBlock(t);
    }
  }

  const websiteSection = formatWebsiteTasksSection(websiteFocusTasks, getOwnerFullName);
  if (websiteSection) {
    msg += `\n${websiteSection}`;
  }

  return msg.trim();
}
