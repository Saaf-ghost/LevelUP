import React from 'react';
import { useSprint } from '../../context/SprintContext';
import { COLUMN_LABELS } from '../../mockData';
import type { Subtask } from '../../mockData';

interface Props {
  tasks: Subtask[];
}

const RequirementsPanel: React.FC<Props> = ({ tasks }) => {
  const { sprint } = useSprint();

  if (!sprint) return null;

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      {sprint.requirements.map(req => {
        const linked = tasks.filter(t => t.requirementId === req.id);
        const totalPts = linked.reduce((s, t) => s + t.storyPoints, 0);
        const donePts  = linked.filter(t => t.status === 'DONE').reduce((s, t) => s + t.storyPoints, 0);
        const progress = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;

        // Compute live status
        let status: string;
        if (linked.length === 0) status = 'TODO';
        else if (linked.every(t => t.status === 'DONE')) status = 'DONE';
        else if (linked.some(t => t.status === 'IN_PROGRESS')) status = 'IN_PROGRESS';
        else status = 'TODO';

        return (
          <div
            key={req.id}
            className="bg-slate-800/50 border border-slate-700/40 rounded-lg p-3 relative overflow-hidden"
          >
            {/* Color accent */}
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: req.color }} />

            <div className="pl-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-slate-200 truncate">{req.title}</h4>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded">
                  {COLUMN_LABELS[status as keyof typeof COLUMN_LABELS] ?? status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mb-2 truncate">{req.description}</p>

              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: req.color }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">{progress}%</span>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-500">{linked.length} subtask{linked.length !== 1 ? 's' : ''}</span>
                <span className="text-[10px] font-semibold text-slate-400">{totalPts} SP</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RequirementsPanel;
