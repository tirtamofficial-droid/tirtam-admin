import { useStore } from '../store/useStore';
import { statusColors, priorityColors, formatDate, isOverdue } from '../utils/helpers';
import type { Task, TaskStatus } from '../types';
import { Clock } from 'lucide-react';
import { useState } from 'react';

const columns: TaskStatus[] = ['Pending', 'In Progress', 'Blocked', 'Review', 'Completed'];

interface Props {
  tasks: Task[];
}

export default function KanbanBoard({ tasks }: Props) {
  const { employees, moveTask, setEditingTask, setTaskModalOpen } = useStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const getOwnerName = (id: string) => employees.find((e) => e.id === id)?.name || 'Unassigned';
  const getOwnerAvatar = (id: string) => employees.find((e) => e.id === id)?.avatar || '??';

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedId) moveTask(draggedId, status);
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {columns.map((status) => {
        const colTasks = tasks.filter((t) => t.status === status);
        const sc = statusColors[status];
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-[260px] rounded-xl transition-colors ${
              dragOverCol === status ? 'bg-zinc-100 ring-2 ring-zinc-300' : 'bg-zinc-50/50'
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
                <span className="text-[13px] font-semibold text-zinc-800">{status}</span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400 bg-white px-2 py-0.5 rounded-md border border-zinc-100">
                {colTasks.length}
              </span>
            </div>

            <div className="px-2 pb-2 space-y-2 min-h-[100px]">
              {colTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
                    className={`bg-white rounded-lg p-3 border border-zinc-100 cursor-pointer
                      hover:shadow-card-hover hover:border-zinc-200 transition-all
                      ${draggedId === task.id ? 'opacity-50 scale-95' : ''}`}
                  >
                    <p className={`text-[13px] font-medium leading-snug ${overdue ? 'text-red-600' : 'text-zinc-800'}`}>
                      {task.name}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityColors[task.priority].bg} ${priorityColors[task.priority].text}`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Clock size={11} />
                        <span className={`text-[10px] ${overdue ? 'text-red-500 font-medium' : ''}`}>
                          {formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-zinc-50">
                      <div className="w-5 h-5 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 text-[8px] font-bold">
                        {getOwnerAvatar(task.owner)}
                      </div>
                      <span className="text-[11px] text-zinc-400">{getOwnerName(task.owner)}</span>
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div className="flex items-center justify-center py-8 text-zinc-300">
                  <p className="text-[12px]">No tasks</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
