import React, { useState, useEffect } from 'react';
import { useSprint } from '../context/SprintContext';
import api from '../api/axios';
import { FolderPlus, Calendar, Plus, Play, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface SprintInfo {
  sprintId: number;
  objective: string;
  startDate: string;
  endDate: string;
  sprintStatus: 'PLANNED' | 'ACTIVE' | 'DONE';
  pointsPlanned: number;
}

const Projects: React.FC = () => {
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    sprint: activeSprintData,
    completeSprint: concludeSprintContext
  } = useSprint();

  // Project forms state
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projLoading, setProjLoading] = useState(false);

  // Sprint list state
  const [sprints, setSprints] = useState<SprintInfo[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(false);

  // Sprint creation form state
  const [sprintObjective, setSprintObjective] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pointsPlanned, setPointsPlanned] = useState(20);
  const [sprintStatus, setSprintStatus] = useState<'ACTIVE' | 'PLANNED'>('ACTIVE');
  const [sprintLoading, setSprintLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load sprints for the selected project
  const loadSprints = async (projectId: number) => {
    setSprintsLoading(true);
    try {
      const res = await api.get<any[]>(`/sprints/project/${projectId}`);
      setSprints(res.data.map(s => ({
        sprintId: s.sprintId,
        objective: s.objective,
        startDate: s.startDate,
        endDate: s.endDate,
        sprintStatus: s.sprintStatus,
        pointsPlanned: s.pointsPlanned
      })));
    } catch (err) {
      console.error('Failed to load sprints for project', err);
    } finally {
      setSprintsLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadSprints(currentProject.id);
    }
  }, [currentProject, activeSprintData]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projDesc.trim()) return;
    setProjLoading(true);
    try {
      const created = await createProject(projName, projDesc);
      setProjName('');
      setProjDesc('');
      setCurrentProject(created);
    } catch (err) {
      console.error(err);
    } finally {
      setProjLoading(false);
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setErrorMsg('');

    // Check active sprint constraint
    const hasActive = sprints.some(s => s.sprintStatus === 'ACTIVE');
    if (sprintStatus === 'ACTIVE' && hasActive) {
      setErrorMsg('This project already has an active sprint. You can only create an UPCOMING sprint or conclude the active one first.');
      return;
    }

    setSprintLoading(true);
    try {
      await api.post('/sprints', {
        objective: sprintObjective,
        startDate,
        endDate,
        sprintStatus,
        pointsPlanned,
        projectId: currentProject.id
      });
      setSprintObjective('');
      setStartDate('');
      setEndDate('');
      setPointsPlanned(20);
      loadSprints(currentProject.id);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create sprint.');
    } finally {
      setSprintLoading(false);
    }
  };

  // Conclude sprint check
  const hasUncompletedTasks = activeSprintData
    ? activeSprintData.subtasks.some(t => t.status !== 'DONE')
    : false;

  const handleConcludeActiveSprint = async (sprintId: number) => {
    if (hasUncompletedTasks) return;
    try {
      await concludeSprintContext(String(sprintId));
      if (currentProject) {
        loadSprints(currentProject.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Projects & Workspace Sprints</h1>
        <p className="text-xs text-slate-500">Manage project spaces, view timelines, and organize sprints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Selector & Creation */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FolderPlus size={16} className="text-indigo-400" />
              Project Workspaces
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => setCurrentProject(p)}
                  className={`w-full text-left p-3 rounded-lg border text-xs font-semibold transition-all ${
                    currentProject?.id === p.id
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <p className="truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 font-normal truncate mt-0.5">{p.description}</p>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-4">No projects created yet.</p>
              )}
            </div>
          </div>

          {/* Create Project Form */}
          <form onSubmit={handleCreateProject} className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200">Create New Project</h2>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Project Name</label>
              <input
                type="text"
                value={projName}
                onChange={e => setProjName(e.target.value)}
                placeholder="e.g. Alpha Platform"
                required
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Description</label>
              <textarea
                value={projDesc}
                onChange={e => setProjDesc(e.target.value)}
                placeholder="Brief project details..."
                required
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={projLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold transition-all shadow-md shadow-indigo-500/10"
            >
              {projLoading ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>

        {/* Sprint Timeline / Sprints View */}
        <div className="lg:col-span-2 space-y-6">
          {currentProject ? (
            <>
              {/* Sprints list */}
              <div className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-200">Sprints for {currentProject.name}</h2>
                  <span className="text-[10px] bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-medium">
                    {sprints.length} sprint{sprints.length !== 1 ? 's' : ''} total
                  </span>
                </div>

                {sprintsLoading ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">Loading sprints...</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {sprints.map(s => {
                      let statusBadge = (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                          <Play size={10} /> Active
                        </span>
                      );
                      if (s.sprintStatus === 'DONE') {
                        statusBadge = (
                          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle size={10} /> Done
                          </span>
                        );
                      } else if (s.sprintStatus === 'PLANNED') {
                        statusBadge = (
                          <span className="flex items-center gap-1 text-[10px] bg-slate-500/10 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-full font-medium">
                            <Clock size={10} /> Upcoming
                          </span>
                        );
                      }

                      return (
                        <div
                          key={s.sprintId}
                          className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-slate-200 truncate">{s.objective}</h3>
                              {statusBadge}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <Calendar size={12} />
                              <span>{s.startDate} to {s.endDate}</span>
                              <span>·</span>
                              <span>{s.pointsPlanned} Planned SP</span>
                            </div>
                          </div>

                          {s.sprintStatus === 'ACTIVE' && (
                            <div className="flex items-center gap-2 self-start md:self-center">
                              {hasUncompletedTasks ? (
                                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 bg-amber-500/5 px-2 py-1.5 rounded-lg border border-amber-500/10">
                                  <AlertTriangle size={12} />
                                  <span>Conclude locked: pending subtasks</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleConcludeActiveSprint(s.sprintId)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all shadow-md shadow-emerald-500/10"
                                >
                                  Conclude Sprint
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {sprints.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-6">No sprints created for this project workspace.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Create Sprint Form */}
              <form onSubmit={handleCreateSprint} className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Plus size={16} className="text-indigo-400" />
                  Create New Sprint
                </h2>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Sprint Objective</label>
                    <input
                      type="text"
                      value={sprintObjective}
                      onChange={e => setSprintObjective(e.target.value)}
                      placeholder="e.g. Core Auth & Dashboard Refactoring"
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Planned Story Points</label>
                    <input
                      type="number"
                      value={pointsPlanned}
                      onChange={e => setPointsPlanned(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Initial Status</label>
                    <select
                      value={sprintStatus}
                      onChange={e => setSprintStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 outline-none cursor-pointer"
                    >
                      <option value="ACTIVE">Active (starts immediately)</option>
                      <option value="PLANNED">Upcoming (backlog status)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sprintLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 px-4 text-xs font-semibold transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                >
                  {sprintLoading ? 'Creating...' : 'Initialize Sprint'}
                </button>
              </form>
            </>
          ) : (
            <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-10 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
              <FolderPlus size={36} className="text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs">No active project workspace selected.</p>
              <p className="text-[10px] text-slate-600 mt-1">Please select an existing workspace from the left pane or initialize a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;
