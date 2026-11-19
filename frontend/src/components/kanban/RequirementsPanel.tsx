import React from 'react';
import { useSprint } from '../../context/SprintContext';
import type { Subtask } from '../../context/SprintContext';

interface Props {
  tasks: Subtask[];
}

const STATUS_LABEL = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
} as const;

const RequirementsPanel: React.FC<Props> = ({ tasks }) => {
  const { sprint } = useSprint();
  if (!sprint) return null;

  return (
    <div className="mb-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
      {sprint.requirements.map(requirement => {
        const linked = tasks.filter(task => task.requirementId === requirement.id);
        const totalPoints = linked.reduce((sum, task) => sum + task.effortPoints, 0);
        const donePoints = linked.filter(task => task.status === 'DONE').reduce((sum, task) => sum + task.effortPoints, 0);
        const progress = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

        let status: keyof typeof STATUS_LABEL = 'TODO';
        if (linked.length > 0 && linked.every(task => task.status === 'DONE')) status = 'DONE';
        else if (linked.some(task => task.status === 'IN_PROGRESS')) status = 'IN_PROGRESS';

        return (
          <div key={requirement.id} className="relative overflow-hidden rounded-lg border border-line bg-surface p-3 pl-4">
            <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: requirement.color }} />

            <div className="mb-1 flex items-center justify-between gap-2">
              <h4 className="truncate text-xs font-semibold text-ink">{requirement.title}</h4>
              <span className="shrink-0 rounded-full border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="mb-2 truncate text-[10px] text-ink-faint">{requirement.description || 'No description'}</p>

            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: requirement.color }}
                />
              </div>
              <span className="text-[10px] font-semibold text-ink-soft tnum">{progress}%</span>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink-faint">
              <span>
                {linked.length} subtask{linked.length === 1 ? '' : 's'}
              </span>
              <span className="font-semibold tnum">{totalPoints} SP</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequirementsPanel;
