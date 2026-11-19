import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Subtask, TaskStatus } from '../../context/SprintContext';
import { useSprint } from '../../context/SprintContext';
import { LayoutTemplate, ListChecks, RotateCcw, AlertCircle } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import RequirementsPanel from './RequirementsPanel';

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

const KanbanBoard: React.FC = () => {
  const { sprint, loading, updateSubtaskStatus, refreshData } = useSprint();
  const [tasks, setTasks] = useState<Subtask[]>([]);
  const [activeTask, setActiveTask] = useState<Subtask | null>(null);
  const [isReqPanelOpen, setIsReqPanelOpen] = useState(false);
  const [moveError, setMoveError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setTasks(sprint?.subtasks ?? []);
  }, [sprint]);

  const getTasksByColumn = (column: TaskStatus) => tasks.filter(task => task.status === column);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(candidate => candidate.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isOverTask) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(task => task.id === active.id);
        const overIndex = prev.findIndex(task => task.id === over.id);
        if (activeIndex !== -1 && overIndex !== -1 && prev[activeIndex].status !== prev[overIndex].status) {
          const next = [...prev];
          next[activeIndex] = { ...next[activeIndex], status: prev[overIndex].status };
          return arrayMove(next, activeIndex, overIndex);
        }
        return prev;
      });
    }

    if (isOverColumn) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(task => task.id === active.id);
        if (activeIndex === -1) return prev;
        if (prev[activeIndex].status === over.id) return prev;
        const next = [...prev];
        next[activeIndex] = { ...next[activeIndex], status: over.id as TaskStatus };
        return next;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const task = tasks.find(candidate => candidate.id === active.id);
    if (!task) return;

    const originalTask = sprint?.subtasks?.find(candidate => candidate.id === active.id);
    const originalStatus = originalTask ? originalTask.status : task.status;

    let newStatus: TaskStatus = task.status;
    if (over.data.current?.type === 'Column') {
      newStatus = over.id as TaskStatus;
    } else if (over.data.current?.type === 'Task') {
      const targetTask = tasks.find(candidate => candidate.id === over.id);
      if (targetTask) newStatus = targetTask.status;
    }

    if (newStatus === originalStatus) return;

    setMoveError('');
    setTasks(prev => prev.map(candidate => (candidate.id === task.id ? { ...candidate, status: newStatus } : candidate)));

    try {
      await updateSubtaskStatus(task.id, newStatus);
    } catch (err: any) {
      // Roll back the optimistic move so the board never lies about the stored state.
      setTasks(prev => prev.map(candidate => (candidate.id === task.id ? { ...candidate, status: originalStatus } : candidate)));
      setMoveError(err?.response?.data?.message || 'That move could not be saved. The card was put back.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-xs text-ink-faint">
        Loading board data…
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-2 px-6 text-center">
        <LayoutTemplate size={30} className="text-ink-faint" />
        <h3 className="font-display text-lg font-semibold text-ink">No active sprint</h3>
        <p className="max-w-sm text-xs leading-relaxed text-ink-soft">
          Open the Backlog tab, scope a few requirements and start a sprint. The board fills up from there.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{sprint.name}</h2>
          <p className="text-xs text-ink-faint tnum">
            {tasks.length} tasks · {tasks.reduce((sum, task) => sum + task.effortPoints, 0)} story points
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshData} className="btn-quiet" title="Reload the board from the server">
            <RotateCcw size={14} />
            Sync
          </button>
          <button onClick={() => setIsReqPanelOpen(open => !open)} className="btn-quiet" aria-expanded={isReqPanelOpen}>
            <ListChecks size={14} />
            Requirements
          </button>
        </div>
      </div>

      {moveError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
          <AlertCircle size={14} />
          {moveError}
        </div>
      )}

      {isReqPanelOpen && <RequirementsPanel tasks={tasks} />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-3">
          <SortableContext items={COLUMNS} strategy={horizontalListSortingStrategy}>
            {COLUMNS.map(column => (
              <KanbanColumn key={column} id={column} tasks={getTasksByColumn(column)} />
            ))}
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
