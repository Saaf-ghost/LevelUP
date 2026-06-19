import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSprint } from '../context/SprintContext';
import { teamMembers, COLUMN_LABELS, getTeamMember } from '../mockData';
import type { Subtask } from '../mockData';
import { ClipboardList } from 'lucide-react';

const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const { sprint } = useSprint();

  if (!user || !sprint) return <div className="p-8 text-slate-300">No active sprint tasks found.</div>;

  // Match the logged-in user to a team member (by name or first matching)
  const teamMember = teamMembers.find(
    m => m.name.toLowerCase().includes(user.firstName.toLowerCase()),
  ) ?? teamMembers[0]; // fallback for demo

  const myTasks: Subtask[] = sprint.subtasks.filter(
    t => t.assigneeId === teamMember?.id,
  );

  const grouped = (['TODO', 'IN_PROGRESS', 'DONE'] as const).map(status => ({
    status,
    label: COLUMN_LABELS[status],
    items: myTasks.filter(t => t.status === status),
  })).filter(g => g.items.length > 0);

  const totalPoints = myTasks.reduce((s, t) => s + t.storyPoints, 0);
  const donePoints  = myTasks.filter(t => t.status === 'DONE').reduce((s, t) => s + t.storyPoints, 0);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <ClipboardList size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">My Tasks</h1>
            <p className="text-xs text-slate-500">
              {myTasks.length} subtask{myTasks.length !== 1 ? 's' : ''} · {donePoints}/{totalPoints} SP completed
            </p>
          </div>
        </div>
      </div>

      {myTasks.length === 0 ? (
        <div className="bg-slate-800/40 p-10 rounded-xl border border-slate-800 text-center text-slate-400">
          <ClipboardList size={32} className="mx-auto mb-3 text-slate-600" />
          <p>You have no tasks assigned.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ status, label, items }) => (
            <div key={status}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                {label} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map(task => {
                  const req = sprint.requirements.find(r => r.id === task.requirementId);
                  const assignee = getTeamMember(task.assigneeId);
                  return (
                    <div
                      key={task.id}
                      className="bg-slate-800/60 rounded-lg border border-slate-700/40 p-3 flex items-center gap-3 hover:border-slate-600 transition-colors relative overflow-hidden"
                    >
                      {/* Stripe */}
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: req?.color ?? '#475569' }} />

                      <div className="flex-1 pl-2 min-w-0">
                        <p className="text-xs text-slate-200 font-medium truncate">{task.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{req?.title ?? '—'}</p>
                      </div>

                      {assignee && (
                        <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-slate-700" />
                      )}

                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700/40 shrink-0">
                        {task.storyPoints} SP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
