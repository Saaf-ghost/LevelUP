import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Subtask, TaskStatus } from '../../context/SprintContext';
import TaskCard from './TaskCard';

interface Props {
  id: TaskStatus;
  tasks: Subtask[];
}

const COLUMN_META: Record<TaskStatus, { label: string; dot: string; chip: string }> = {
  TODO: { label: 'To Do', dot: 'bg-ink-faint', chip: 'border-line bg-surface-2 text-ink-soft' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-brand', chip: 'border-brand/30 bg-brand-soft text-brand' },
  DONE: { label: 'Done', dot: 'bg-leaf', chip: 'border-leaf/30 bg-leaf-soft text-leaf' },
};

const KanbanColumn: React.FC<Props> = ({ id, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'Column', columnId: id },
  });

  const totalPoints = tasks.reduce((sum, task) => sum + task.effortPoints, 0);
  const meta = COLUMN_META[id];

  return (
    <section
      className={`flex min-h-[320px] flex-col overflow-hidden rounded-xl border bg-surface-2 transition-colors ${
        isOver ? 'border-brand/60 bg-brand-soft/40' : 'border-line'
      }`}
      aria-label={meta.label}
    >
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-line bg-surface px-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink">{meta.label}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint tnum">
            {tasks.length}
          </span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tnum ${meta.chip}`}>
            {totalPoints} SP
          </span>
        </div>
      </header>

      <div ref={setNodeRef} className="flex max-h-[62vh] flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex min-h-[88px] flex-1 items-center justify-center rounded-lg border border-dashed border-line-strong text-[11px] font-medium text-ink-faint">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
};

export default KanbanColumn;
