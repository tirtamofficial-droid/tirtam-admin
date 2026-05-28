import { create } from 'zustand';
import type { Task, Employee, ActivityEntry, Department, TaskStatus, Priority, WhatsAppConfig, ViewMode } from '../types';
import { generateId } from '../utils/helpers';
import { isSupabaseConfigured } from '../lib/supabase';
import { dbAddTask, dbUpdateTask, dbDeleteTask } from '../hooks/useSupabaseData';

interface Filters {
  owner: string;
  status: TaskStatus | '';
  priority: Priority | '';
  search: string;
}

interface AppState {
  tasks: Task[];
  employees: Employee[];
  activities: ActivityEntry[];
  currentUser: Employee | null;
  isFounder: boolean;
  activeDepartment: Department | null;
  activeView: ViewMode;
  filters: Filters;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  taskModalOpen: boolean;
  editingTask: Task | null;
  whatsappConfig: WhatsAppConfig;
  dataLoaded: boolean;

  setCurrentUser: (user: Employee) => void;
  setIsFounder: (val: boolean) => void;
  setActiveDepartment: (dept: Department | null) => void;
  setActiveView: (view: ViewMode) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  setMobileSidebarOpen: (val: boolean) => void;
  setTaskModalOpen: (val: boolean) => void;
  setEditingTask: (task: Task | null) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;

  addActivity: (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => void;

  getTasksByDepartment: (dept: Department) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByOwner: (ownerId: string) => Task[];
  getOverdueTasks: () => Task[];
  getFilteredTasks: (dept?: Department) => Task[];

  setWhatsAppConfig: (config: Partial<WhatsAppConfig>) => void;
}

const defaultFilters: Filters = {
  owner: '',
  status: '',
  priority: '',
  search: '',
};

export const useStore = create<AppState>()((set, get) => ({
  tasks: [],
  employees: [],
  activities: [],
  currentUser: null,
  isFounder: true,
  activeDepartment: null,
  activeView: 'table',
  filters: { ...defaultFilters },
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  taskModalOpen: false,
  editingTask: null,
  dataLoaded: false,
  whatsappConfig: {
    enabled: true,
    sendTime: '09:00',
    phoneNumber: '',
    groupName: 'Tirtam',
    lastSent: null,
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setIsFounder: (val) => set({ isFounder: val }),
  setActiveDepartment: (dept) => set({ activeDepartment: dept, activeView: 'table', filters: { ...defaultFilters } }),
  setActiveView: (view) => set({ activeView: view }),
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
  setMobileSidebarOpen: (val) => set({ mobileSidebarOpen: val }),
  setTaskModalOpen: (val) => set({ taskModalOpen: val }),
  setEditingTask: (task) => set({ editingTask: task }),

  addTask: (taskData) => {
    const user = get().currentUser || get().employees[0];

    if (isSupabaseConfigured) {
      const now = new Date().toISOString();
      const tempId = 'temp-' + Date.now();
      const tempTask: Task = {
        ...taskData,
        id: tempId,
        createdAt: now,
        updatedAt: now,
      };
      set((s) => ({ tasks: [tempTask, ...s.tasks] }));
      dbAddTask(taskData, user?.name || 'Unknown').then(() => {
        // realtime subscription will replace the temp task with the real one
      });
      return;
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ tasks: [newTask, ...s.tasks] }));

    if (user) {
      get().addActivity({
        userId: user.id,
        userName: user.name,
        action: 'created',
        taskId: newTask.id,
        taskName: newTask.name,
        details: `created task "${newTask.name}" in ${newTask.department}`,
        department: newTask.department,
      });
    }
  },

  updateTask: (id, updates) => {
    const task = get().tasks.find((t) => t.id === id);
    const user = get().currentUser || get().employees[0];

    // Always update local state immediately (optimistic)
    const now = new Date().toISOString();
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: now } : t
      ),
    }));

    if (isSupabaseConfigured && task && user) {
      dbUpdateTask(id, updates, user.id, user.name, task.name, task.department);
      return;
    }

    if (task && user) {
      const detailParts: string[] = [];
      if (updates.status) detailParts.push(`status to ${updates.status}`);
      if (updates.priority) detailParts.push(`priority to ${updates.priority}`);
      if (updates.owner) detailParts.push(`owner to ${updates.owner}`);
      get().addActivity({
        userId: user.id,
        userName: user.name,
        action: updates.status === 'Completed' ? 'completed' : updates.status ? 'moved' : 'updated',
        taskId: id,
        taskName: task.name,
        details: detailParts.length > 0
          ? `updated ${detailParts.join(', ')} for "${task.name}"`
          : `updated "${task.name}"`,
        department: task.department,
      });
    }
  },

  deleteTask: (id) => {
    if (isSupabaseConfigured) {
      dbDeleteTask(id);
      return;
    }
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  moveTask: (id, status) => {
    get().updateTask(id, { status });
  },

  addActivity: (entry) => {
    const newActivity: ActivityEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      activities: [newActivity, ...s.activities].slice(0, 200),
    }));
  },

  getTasksByDepartment: (dept) => get().tasks.filter((t) => t.department === dept),
  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
  getTasksByOwner: (ownerId) => get().tasks.filter((t) => t.owner === ownerId),
  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter(
      (t) => t.status !== 'Completed' && new Date(t.deadline) < now
    );
  },

  getFilteredTasks: (dept) => {
    const { tasks, filters } = get();
    let filtered = dept ? tasks.filter((t) => t.department === dept) : tasks;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.notes.toLowerCase().includes(q)
      );
    }
    if (filters.owner) filtered = filtered.filter((t) => t.owner === filters.owner);
    if (filters.status) filtered = filtered.filter((t) => t.status === filters.status);
    if (filters.priority) filtered = filtered.filter((t) => t.priority === filters.priority);
    return filtered;
  },

  setWhatsAppConfig: (config) =>
    set((s) => ({ whatsappConfig: { ...s.whatsappConfig, ...config } })),
}));
