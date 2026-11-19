import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlertCircle } from 'lucide-react';
import { type Subtask, useSprint } from '../../context/SprintContext';
import clsx from 'clsx';

interface Props {
  task: Subtask;
  isOverlay?: boolean;
}

const TaskCard: React.FC<Props> = ({ task, isOverlay }) => {
  const { sprint } = useSprint();
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // Compute time in column dynamically
  // @ts-ignore
  const statusChangedAt = task.statusChangedAt;
  const now = new Date().getTime();
  const changedAt = statusChangedAt ? new Date(statusChangedAt).getTime() : now;
  const timeInColumn = Math.max(0, Math.round((now - changedAt) / (1000 * 60 * 60))); // in hours

  const isBottleneck = timeInColumn > 48;
  const requirement = sprint?.requirements.find(r => r.id === task.requirementId);
  const assignee = task.assignee;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[105px] rounded-xl border-2 border-dashed border-orange-400 bg-orange-50/40"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'bg-white rounded-xl border group cursor-grab active:cursor-grabbing hover:border-orange-300 hover:shadow-md transition-all duration-150 relative overflow-hidden',
        isOverlay
          ? 'shadow-2xl shadow-orange-500/20 border-orange-500 scale-[1.03]'
          : 'border-slate-200/90 shadow-xs',
      )}
    >
      {/* Requirement stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: isBottleneck ? '#ef4444' : (requirement?.color ?? '#f97316') }}
      />

      <div className="p-3 pl-4">
        {/* Requirement label + time badge */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider truncate max-w-[130px]"
            style={{ color: requirement?.color ?? '#ea580c' }}
            title={requirement?.title}
          >
            {requirement?.title ?? 'Unlinked'}
          </span>

          {isBottleneck && (
            <span className="flex items-center gap-0.5 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 border border-rose-200" title="Bottleneck">
              <AlertCircle size={10} />
              {timeInColumn}h
            </span>
          )}
          {!isBottleneck && timeInColumn > 0 && (
            <span className="flex items-center gap-0.5 text-slate-400 text-[10px] font-medium shrink-0">
              <Clock size={10} />
              {timeInColumn}h
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-[13px] font-semibold text-slate-800 leading-snug mb-3 group-hover:text-orange-600 transition-colors">
          {task.title}
        </p>

        {/* Footer: Points + Assignee avatar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              {task.effortPoints} SP
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              {task.estimatedHours}h est.
            </span>
          </div>

          {/* Assignee Avatar */}
          {assignee ? (
            <div
              className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-[9px] font-bold text-white shadow-xs"
              title={assignee.fullName}
            >
              {assignee.fullName.charAt(0)}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400" title="Unassigned">
              -
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
