import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Subtask, TaskStatus } from '../../context/SprintContext';
import TaskCard from './TaskCard';

interface Props {
  id: TaskStatus;
  tasks: Subtask[];
}

const COLUMN_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const KanbanColumn: React.FC<Props> = ({ id, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'Column', columnId: id },
  });

  const totalPoints = tasks.reduce((sum, t) => sum + t.effortPoints, 0);

  // Column headers with orange/amber/emerald branding
  const colBadgeStyle: Record<TaskStatus, { dot: string; bg: string; text: string; border: string }> = {
    TODO: { 
      dot: 'bg-slate-400', 
      bg: 'bg-slate-100', 
      text: 'text-slate-700', 
      border: 'border-slate-200' 
    },
    IN_PROGRESS: { 
      dot: 'bg-orange-500', 
      bg: 'bg-orange-50', 
      text: 'text-orange-700', 
      border: 'border-orange-200' 
    },
    DONE: { 
      dot: 'bg-emerald-500', 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-200' 
    },
  };

  const style = colBadgeStyle[id];

  return (
    <div className="flex flex-col flex-1 min-w-[270px] bg-slate-50/70 rounded-2xl border border-slate-200/90 h-full max-h-full overflow-hidden shadow-xs">
      {/* Column header */}
      <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {COLUMN_LABELS[id]}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
            {tasks.length}
          </span>
          <span className={`text-[10px] font-bold ${style.bg} ${style.text} px-2 py-0.5 rounded-full border ${style.border}`}>
            {totalPoints} SP
          </span>
        </div>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 transition-colors ${
          isOver ? 'bg-orange-500/5 ring-2 ring-orange-400/40 rounded-b-2xl' : ''
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-full min-h-[90px] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-medium bg-white/40">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
