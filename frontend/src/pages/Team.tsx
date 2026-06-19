import React from 'react';
import { useSprint } from '../context/SprintContext';
import { Mail, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

const Team: React.FC = () => {
  const { sprint, members } = useSprint();

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Team Workloads & Capabilities</h1>
        <p className="text-xs text-slate-500">
          Monitor workloads, skill profiles, and assigned subtasks for current active sprint.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {members.map(member => {
          // Get subtasks assigned to this member
          const assignedTasks = sprint 
            ? sprint.subtasks.filter(t => t.assigneeId === member.id)
            : [];
          const totalPoints = assignedTasks.reduce((s, t) => s + t.storyPoints, 0);
          
          const doneTasks = assignedTasks.filter(t => t.status === 'DONE');
          const donePoints = doneTasks.reduce((s, t) => s + t.storyPoints, 0);
          const activeTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS');
          
          // Workload capacity indicator color
          let workloadColor = 'bg-slate-700';
          let workloadText = 'Low Workload';
          if (totalPoints > 15) {
            workloadColor = 'bg-red-500';
            workloadText = 'Overloaded';
          } else if (totalPoints > 8) {
            workloadColor = 'bg-indigo-500';
            workloadText = 'Optimal Capacity';
          } else if (totalPoints > 0) {
            workloadColor = 'bg-emerald-500';
            workloadText = 'Light Load';
          }

          return (
            <div 
              key={member.id} 
              className="bg-slate-800/40 rounded-xl border border-slate-700/40 p-5 flex flex-col justify-between hover:border-slate-600 transition-all duration-200"
            >
              {/* Member Info */}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-12 h-12 rounded-full border-2 border-indigo-500/20 object-cover shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-bold text-slate-200 truncate">{member.name}</h2>
                      <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full text-white ${workloadColor}`}>
                        {workloadText}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Mail size={12} />
                      <span className="truncate">{member.name.toLowerCase().replace(' ', '.')}@levelup.com</span>
                    </div>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mb-4">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map(skill => (
                      <span 
                        key={skill} 
                        className="text-[10px] bg-slate-900/60 border border-slate-700 text-indigo-400 px-2 py-0.5 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workload Stats */}
                <div className="grid grid-cols-3 gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-700/30 mb-4">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">Total SP</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{totalPoints} SP</p>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">Active Tasks</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{activeTasks.length}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">Completed</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{donePoints} SP</p>
                  </div>
                </div>

                {/* Subtask list */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Assigned Tasks ({assignedTasks.length})
                  </span>
                  
                  {assignedTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-2">No tasks assigned in this sprint.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {assignedTasks.map(task => {
                        const req = sprint?.requirements.find(r => r.id === task.requirementId);
                        
                        let statusIcon = <Clock size={12} className="text-blue-400" />;
                        if (task.status === 'DONE') {
                          statusIcon = <CheckCircle2 size={12} className="text-emerald-400" />;
                        } else if (task.status === 'IN_PROGRESS') {
                          statusIcon = <PlayCircle size={12} className="text-amber-400" />;
                        }

                        return (
                          <div 
                            key={task.id}
                            className="bg-slate-900/30 border border-slate-800 rounded p-2 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-200 font-medium truncate">{task.title}</p>
                              {req && (
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  Requirement: {req.title}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 font-medium">
                                {task.storyPoints} SP
                              </span>
                              <div className="flex items-center gap-1" title={task.status}>
                                {statusIcon}
                                <span className="text-[10px] text-slate-400 hidden lg:inline uppercase font-bold">
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <div className="col-span-2 bg-slate-800/20 border border-slate-800 rounded-xl p-10 text-center text-slate-500 flex flex-col items-center justify-center">
            <Mail size={32} className="text-slate-700 mb-2" />
            <p className="text-xs">No team members assigned to this project.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
