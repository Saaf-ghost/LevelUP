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
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const statusChangedAt = task.statusChangedAt;
  const now = Date.now();
  const changedAt = statusChangedAt ? new Date(statusChangedAt).getTime() : now;
  const hoursInColumn = Math.max(0, Math.round((now - changedAt) / (1000 * 60 * 60)));

  const isStalled = task.status !== 'DONE' && hoursInColumn > 48;
  const requirement = sprint?.requirements.find(item => item.id === task.requirementId);
  const assignee = task.assignee;

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[104px] rounded-lg border-2 border-dashed border-brand/50 bg-brand-soft/40"
      />
    );
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'group relative cursor-grab overflow-hidden rounded-lg border bg-surface p-3 pl-4 transition active:cursor-grabbing',
        isOverlay
          ? 'rotate-1 border-brand shadow-2xl'
          : 'border-line hover:border-brand/40 hover:shadow-md',
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: isStalled ? 'var(--danger)' : requirement?.color || 'var(--brand)' }}
      />

      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className="max-w-[130px] truncate text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: requirement?.color || 'var(--brand)' }}
          title={requirement?.title}
        >
          {requirement?.title ?? 'Unlinked'}
        </span>

        {isStalled ? (
          <span
            className="flex shrink-0 items-center gap-0.5 rounded-full border border-danger/30 bg-danger-soft px-1.5 py-0.5 text-[10px] font-bold text-danger"
            title="No movement for more than 48 hours"
          >
            <AlertCircle size={10} />
            {hoursInColumn}h
          </span>
        ) : hoursInColumn > 0 ? (
          <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-ink-faint">
            <Clock size={10} />
            {hoursInColumn}h
          </span>
        ) : null}
      </div>

      <p className="mb-3 text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand">
        {task.title}
      </p>

      <div className="flex items-center justify-between border-t border-line pt-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-ink-soft tnum">
            {task.effortPoints} SP
          </span>
          <span className="text-[10px] font-medium text-ink-faint tnum">{task.estimatedHours}h est.</span>
        </div>

        {assignee ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#f6b544] text-[9px] font-bold uppercase text-white"
            title={assignee.fullName}
          >
            {assignee.fullName.charAt(0)}
          </span>
        ) : (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-line-strong text-[9px] text-ink-faint"
            title="Unassigned"
          >
            –
          </span>
        )}
      </div>
    </article>
  );
};

export default TaskCard;
