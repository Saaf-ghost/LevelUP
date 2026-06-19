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
import { useAuth } from '../../context/AuthContext';
import { useSprint } from '../../context/SprintContext';
import { Plus, LayoutTemplate, ListChecks, RotateCcw } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import AddSubtaskModal from './AddSubtaskModal';
import RequirementsPanel from './RequirementsPanel';

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

const KanbanBoard: React.FC = () => {
  const { sprint, loading, updateSubtaskStatus, refreshData } = useSprint();
  const [tasks, setTasks] = useState<Subtask[]>([]);
  const [activeTask, setActiveTask] = useState<Subtask | null>(null);
  const [isAddSubtaskModalOpen, setIsAddSubtaskModalOpen] = useState(false);
  const [isReqPanelOpen, setIsReqPanelOpen] = useState(false);
  const { role } = useAuth();

  const canAddTask = role !== 'VIEWER';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Keep local tasks state in sync with context
  useEffect(() => {
    if (sprint) {
      setTasks(sprint.subtasks || []);
    } else {
      setTasks([]);
    }
  }, [sprint]);

  const getTasksByColumn = (col: TaskStatus) => tasks.filter(t => t.status === col);

  // ---------- Drag handlers ----------
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask   = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isOverTask) {
      setTasks(prev => {
        const ai = prev.findIndex(t => t.id === active.id);
        const oi = prev.findIndex(t => t.id === over.id);
        if (ai !== -1 && oi !== -1 && prev[ai].status !== prev[oi].status) {
          const next = [...prev];
          next[ai] = { ...next[ai], status: prev[oi].status };
          return arrayMove(next, ai, oi);
        }
        return prev;
      });
    }

    if (isOverColumn) {
      setTasks(prev => {
        const ai = prev.findIndex(t => t.id === active.id);
        if (ai !== -1) {
          const next = [...prev];
          next[ai] = { ...next[ai], status: over.id as TaskStatus };
          return next;
        }
        return prev;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    let newStatus: TaskStatus = task.status;
    const isOverColumn = over.data.current?.type === 'Column';
    const isOverTask = over.data.current?.type === 'Task';

    if (isOverColumn) {
      newStatus = over.id as TaskStatus;
    } else if (isOverTask) {
      const targetTask = tasks.find(t => t.id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      }
    }

    if (newStatus !== task.status) {
      // Optimistically update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await updateSubtaskStatus(task.id, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
        <p className="text-xs animate-pulse">Loading board data...</p>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-800/10 border border-slate-800/60 rounded-xl p-8 text-center text-slate-500">
        <LayoutTemplate size={36} className="text-slate-700 mb-3" />
        <h3 className="text-sm font-bold text-slate-400">No Active Sprint</h3>
        <p className="text-xs text-slate-600 max-w-sm mt-1">
          There is no active sprint for the current project workspace. Sprints must be created and started inside the Projects tab.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-100">Board</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
            title="Refresh dashboard state"
          >
            <RotateCcw size={14} />
            Sync State
          </button>
          <button
            onClick={() => setIsReqPanelOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
          >
            <ListChecks size={14} />
            Requirements
          </button>
          {canAddTask && (
            <button
              onClick={() => setIsAddSubtaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
            >
              <Plus size={14} />
              Add Subtask
            </button>
          )}
        </div>
      </div>

      {/* Requirements summary */}
      {isReqPanelOpen && <RequirementsPanel tasks={tasks} />}

      {/* Kanban columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto h-full pb-4 items-start">
          <SortableContext items={COLUMNS} strategy={horizontalListSortingStrategy}>
            {COLUMNS.map(col => (
              <KanbanColumn key={col} id={col} tasks={getTasksByColumn(col)} />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {isAddSubtaskModalOpen && (
        <AddSubtaskModal onClose={() => setIsAddSubtaskModalOpen(false)} />
      )}
    </div>
  );
};

export default KanbanBoard;
