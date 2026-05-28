import { useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useStore } from '../store/useStore';
import type { Task, Employee, ActivityEntry } from '../types';

function mapDbTask(row: any): Task {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    owner: row.owner || '',
    department: row.department,
    priority: row.priority,
    status: row.status,
    deadline: row.deadline,
    notes: row.notes || '',
    dependencies: row.dependencies || [],
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    department: row.department,
  };
}

function mapDbActivity(row: any): ActivityEntry {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    taskId: row.task_id,
    taskName: row.task_name,
    details: row.details,
    department: row.department,
    timestamp: row.created_at,
  };
}

export function useSupabaseData() {
  const { profile } = useAuth();

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !profile) return;

    const [tasksRes, employeesRes, activitiesRes] = await Promise.all([
      supabase.from('tasks').select('*').order('updated_at', { ascending: false }),
      supabase.from('employees').select('*').order('name'),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    if (tasksRes.data) {
      useStore.setState({ tasks: tasksRes.data.map(mapDbTask) });
    }
    if (employeesRes.data) {
      const mapped = employeesRes.data.map(mapDbEmployee);
      useStore.setState({ employees: mapped });

      const me = mapped.find(e => e.id === profile.id);
      if (me) {
        useStore.setState({ currentUser: me });
      }
    }
    if (activitiesRes.data) {
      useStore.setState({ activities: activitiesRes.data.map(mapDbActivity) });
    }
    useStore.setState({ dataLoaded: true });
  }, [profile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!isSupabaseConfigured || !profile) return;

    const tasksChannel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const currentTasks = useStore.getState().tasks;
        if (payload.eventType === 'INSERT') {
          const newTask = mapDbTask(payload.new);
          useStore.setState({ tasks: [newTask, ...currentTasks] });
        } else if (payload.eventType === 'UPDATE') {
          const updated = mapDbTask(payload.new);
          useStore.setState({
            tasks: currentTasks.map((t) => (t.id === updated.id ? updated : t)),
          });
        } else if (payload.eventType === 'DELETE') {
          useStore.setState({
            tasks: currentTasks.filter((t) => t.id !== (payload.old as any).id),
          });
        }
      })
      .subscribe();

    const activitiesChannel = supabase
      .channel('activities-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, (payload) => {
        const currentActivities = useStore.getState().activities;
        const newActivity = mapDbActivity(payload.new);
        useStore.setState({
          activities: [newActivity, ...currentActivities].slice(0, 200),
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, [profile]);
}

export async function dbAddTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, userName: string) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      name: task.name,
      description: task.description,
      owner: task.owner && task.owner.trim() !== '' ? task.owner : null,
      department: task.department,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline,
      notes: task.notes,
      dependencies: task.dependencies,
      tags: task.tags,
    })
    .select()
    .single();

  if (data && !error) {
    await supabase.from('activities').insert({
      user_id: task.owner,
      user_name: userName,
      action: 'created',
      task_id: data.id,
      task_name: data.name,
      details: `created task "${data.name}" in ${data.department}`,
      department: data.department,
    });
  }
  return { data, error };
}

export async function dbUpdateTask(
  id: string,
  updates: Partial<Task>,
  userId: string,
  userName: string,
  taskName: string,
  department: string
) {
  if (!isSupabaseConfigured) return null;

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.owner !== undefined) dbUpdates.owner = updates.owner && updates.owner.trim() !== '' ? updates.owner : null;
  if (updates.department !== undefined) dbUpdates.department = updates.department;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);

  if (!error) {
    const detailParts: string[] = [];
    if (updates.status) detailParts.push(`status to ${updates.status}`);
    if (updates.priority) detailParts.push(`priority to ${updates.priority}`);

    await supabase.from('activities').insert({
      user_id: userId,
      user_name: userName,
      action: updates.status === 'Completed' ? 'completed' : updates.status ? 'moved' : 'updated',
      task_id: id,
      task_name: taskName,
      details: detailParts.length > 0
        ? `updated ${detailParts.join(', ')} for "${taskName}"`
        : `updated "${taskName}"`,
      department,
    });
  }
  return { error };
}

export async function dbDeleteTask(id: string) {
  if (!isSupabaseConfigured) return null;
  return supabase.from('tasks').delete().eq('id', id);
}
