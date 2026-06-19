import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlertCircle } from 'lucide-react';
import { type Subtask, mockRequirements, getTeamMember } from '../../mockData';
import clsx from 'clsx';

interface Props {
  task: Subtask;
  isOverlay?: boolean;
}

const TaskCard: React.FC<Props> = ({ task, isOverlay }) => {
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

  const isBottleneck = task.timeInColumn > 48;
  const requirement = mockRequirements.find(r => r.id === task.requirementId);
  const assignee = getTeamMember(task.assigneeId);

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[100px] rounded-lg border-2 border-dashed border-indigo-500/40 bg-indigo-500/5"
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
        'bg-slate-800/80 rounded-lg border group cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all duration-150 relative overflow-hidden',
        isOverlay
          ? 'shadow-2xl shadow-indigo-500/20 border-indigo-500 scale-[1.03]'
          : 'border-slate-700/60 shadow-sm',
      )}
    >
      {/* Requirement stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: isBottleneck ? '#ef4444' : (requirement?.color ?? '#475569') }}
      />

      <div className="p-3 pl-4">
        {/* Requirement label + time badge */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider truncate"
            style={{ color: requirement?.color ?? '#94a3b8' }}
            title={requirement?.title}
          >
            {requirement?.title ?? 'Unlinked'}
          </span>

          {isBottleneck && (
            <span className="flex items-center gap-0.5 text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0" title="Bottleneck">
              <AlertCircle size={10} />
              {task.timeInColumn}h
            </span>
          )}
          {!isBottleneck && task.timeInColumn > 0 && (
            <span className="flex items-center gap-0.5 text-slate-500 text-[10px] shrink-0">
              <Clock size={10} />
              {task.timeInColumn}h
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-[13px] font-medium text-slate-200 leading-snug mb-3 group-hover:text-indigo-300 transition-colors">
          {task.title}
        </p>

        {/* Footer: assignee + points */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {assignee ? (
              <>
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  title={`${assignee.name} — ${assignee.skills.join(', ')}`}
                  className="w-5 h-5 rounded-full border border-slate-700"
                />
                <span className="text-[10px] text-slate-400 hidden sm:inline">{assignee.name.split(' ')[0]}</span>
              </>
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-700 border border-dashed border-slate-600 flex items-center justify-center text-[9px] text-slate-500">
                ?
              </div>
            )}
          </div>

          <span className="text-[10px] font-semibold text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/40">
            {task.storyPoints} SP
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
