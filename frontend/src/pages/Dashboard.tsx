import React, { useState, useMemo, useEffect } from 'react';
import { useSprint } from '../context/SprintContext';
import type { TaskStatus } from '../context/SprintContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  BarChart4,
  AlertTriangle,
  Users,
  ChevronRight,
  ChevronDown,
  Calendar,
  Mail,
  UserPlus,
  Play,
  FolderOpen,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { BacklogPdfUploadModal } from '../components/ai/BacklogPdfUploadModal';

const DEFAULT_REQ_COLOR = '#e2560e';

const ProjectCard: React.FC<{
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  role: 'Owner' | 'Member';
  onClick: () => void;
}> = ({ name, description, startDate, endDate, role, onClick }) => {
  const isOwner = role === 'Owner';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        isOwner ? 'border-line hover:border-brand/50' : 'border-line hover:border-leaf/50'
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${isOwner ? 'bg-brand' : 'bg-leaf'}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`truncate text-sm font-semibold text-ink transition-colors ${isOwner ? 'group-hover:text-brand' : 'group-hover:text-leaf'}`}>
            {name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{description}</p>
        </div>
        <span
          className={`chip shrink-0 uppercase tracking-[0.08em] ${
            isOwner ? 'border-brand/25 bg-brand-soft text-brand' : 'border-leaf/25 bg-leaf-soft text-leaf'
          }`}
        >
          {role}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-2.5 text-[10px] text-ink-faint">
        <span className="flex items-center gap-1 tnum">
          <Calendar size={11} />
          {startDate || '—'} → {endDate || '—'}
        </span>
        <span className={`flex items-center gap-1 font-semibold ${isOwner ? 'text-brand' : 'text-leaf'}`}>
          Open <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    ownedProjects,
    memberProjects,
    currentProject,
    setCurrentProject,
    sprint,
    metrics,
    loading,
    members,
    allProjectRequirements,
    refreshData,
    updateSubtaskStatus,
    addNewRequirement,
    addNewSubtask,
    createNewSprint,
    completeSprint,
    createProject,
    inviteMember,
  } = useSprint();

  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [actionError, setActionError] = useState('');

  const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [isCreatingProj, setIsCreatingProj] = useState(false);
  const [createError, setCreateError] = useState('');

  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqColor, setNewReqColor] = useState(DEFAULT_REQ_COLOR);
  const [isAddingReq, setIsAddingReq] = useState(false);

  const [activeReqForSubtask, setActiveReqForSubtask] = useState<number | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskSP, setNewSubtaskSP] = useState(3);
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<number | ''>('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const [sprintObjective, setSprintObjective] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');
  const [selectedReqIds, setSelectedReqIds] = useState<number[]>([]);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [expandedReqs, setExpandedReqs] = useState<Record<number, boolean>>({});
  const [expandedMembers, setExpandedMembers] = useState<Record<number, boolean>>({});

  const chartGrid = isDark ? '#322c24' : '#e8dfd1';
  const chartAxis = isDark ? '#8e8477' : '#8b8275';
  const chartTooltip = {
    backgroundColor: isDark ? '#241f19' : '#ffffff',
    borderColor: isDark ? '#3a332a' : '#e8dfd1',
    borderRadius: '8px',
    fontSize: '11px',
    color: isDark ? '#f4eee3' : '#211e19',
  };
  const brandLine = isDark ? '#fb8b3c' : '#e2560e';
  const leafLine = isDark ? '#b3e04b' : '#4f7c12';

  const toggleReqExpand = (id: number) => setExpandedReqs(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProjName.trim() || !newProjDesc.trim()) return;
    setIsCreatingProj(true);
    setCreateError('');
    try {
      await createProject(newProjName.trim(), newProjDesc.trim());
      setNewProjName('');
      setNewProjDesc('');
      setIsCreateProjOpen(false);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Could not create that project.');
    } finally {
      setIsCreatingProj(false);
    }
  };

  const handleAddRequirement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newReqTitle.trim()) return;
    setIsAddingReq(true);
    setActionError('');
    try {
      await addNewRequirement(newReqTitle.trim(), newReqDesc.trim(), newReqColor);
      setNewReqTitle('');
      setNewReqDesc('');
      setNewReqColor(DEFAULT_REQ_COLOR);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Could not add the requirement.');
    } finally {
      setIsAddingReq(false);
    }
  };

  const handleAddSubtask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSubtaskTitle.trim() || activeReqForSubtask === null) return;
    setIsAddingSubtask(true);
    setActionError('');
    try {
      await addNewSubtask(
        activeReqForSubtask,
        newSubtaskTitle.trim(),
        newSubtaskSP,
        newSubtaskAssignee ? Number(newSubtaskAssignee) : null,
      );
      setNewSubtaskTitle('');
      setNewSubtaskSP(3);
      setNewSubtaskAssignee('');
      setActiveReqForSubtask(null);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Could not add the task.');
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleInitializeSprint = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sprintObjective.trim() || !sprintStart || !sprintEnd || selectedReqIds.length === 0) return;
    setIsCreatingSprint(true);
    setActionError('');
    const totalSelectedSP = allProjectRequirements
      .filter(requirement => selectedReqIds.includes(requirement.id))
      .reduce((sum, requirement) => sum + (requirement.tasks?.reduce((taskSum, task) => taskSum + task.effortPoints, 0) || 0), 0);

    try {
      await createNewSprint(sprintObjective.trim(), sprintStart, sprintEnd, totalSelectedSP, selectedReqIds);
      setSprintObjective('');
      setSprintStart('');
      setSprintEnd('');
      setSelectedReqIds([]);
      setActiveTab('A');
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Could not start the sprint.');
    } finally {
      setIsCreatingSprint(false);
    }
  };

  const handleInviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteMsg(null);
    try {
      await inviteMember(inviteEmail.trim());
      setInviteMsg({ text: `Invited ${inviteEmail.trim()} to this project.`, type: 'success' });
      setInviteEmail('');
    } catch (err: any) {
      setInviteMsg({
        text: err.response?.data?.message || 'Failed to invite. Check that the person is registered.',
        type: 'error',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const changeTaskStatus = async (taskId: number, nextStatus: TaskStatus) => {
    setActionError('');
    try {
      await updateSubtaskStatus(taskId, nextStatus);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'That status change was rejected.');
    }
  };

  const handleToggleSubtaskCheckbox = async (subtaskId: number, currentStatus: string) => {
    await changeTaskStatus(subtaskId, currentStatus === 'DONE' ? 'TODO' : 'DONE');
  };

  const handleToggleRequirementCheckbox = async (reqTasks: any[]) => {
    if (reqTasks.length === 0) return;
    const allDone = reqTasks.every((task: any) => task.status === 'DONE');
    const targetStatus: TaskStatus = allDone ? 'TODO' : 'DONE';
    for (const task of reqTasks) {
      if (task.status !== targetStatus) {
        await changeTaskStatus(task.id, targetStatus);
      }
    }
  };

  /* ---------------- Metrics (all derived from the API, nothing simulated) ---------------- */

  const burndownData = useMemo(() => {
    const points = metrics?.burndownPoints ?? [];
    if (points.length === 0) return [];
    const total = metrics?.activeSprintTotalPoints ?? 0;
    const lastIndex = Math.max(1, points.length - 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return points.map((point, index) => {
      const dayEnd = new Date(`${point.day}T00:00:00`);
      const label = dayEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const isRecorded = dayEnd.getTime() <= today.getTime();
      return {
        day: label,
        Ideal: Math.round(total - (total * index) / lastIndex),
        Actual: isRecorded ? point.remainingPoints : null,
      };
    });
  }, [metrics]);

  const distributionData = useMemo(() => {
    if (!sprint) return [];
    const sumFor = (status: TaskStatus) =>
      sprint.subtasks.filter(task => task.status === status).reduce((sum, task) => sum + task.effortPoints, 0);

    return [
      { name: 'To Do', points: sumFor('TODO'), color: isDark ? '#8e8477' : '#b3a795' },
      { name: 'In Progress', points: sumFor('IN_PROGRESS'), color: brandLine },
      { name: 'Done', points: sumFor('DONE'), color: leafLine },
    ];
  }, [sprint, isDark, brandLine, leafLine]);

  const sprintProgress = useMemo(() => {
    if (!sprint) {
      return { totalTasks: 0, doneTasks: 0, inProgressTasks: 0, todoTasks: 0, totalPoints: 0, donePoints: 0, completionPct: 0 };
    }
    const doneTasks = sprint.subtasks.filter(task => task.status === 'DONE');
    const totalPoints = sprint.subtasks.reduce((sum, task) => sum + task.effortPoints, 0);
    const donePoints = doneTasks.reduce((sum, task) => sum + task.effortPoints, 0);
    return {
      totalTasks: sprint.subtasks.length,
      doneTasks: doneTasks.length,
      inProgressTasks: sprint.subtasks.filter(task => task.status === 'IN_PROGRESS').length,
      todoTasks: sprint.subtasks.filter(task => task.status === 'TODO').length,
      totalPoints,
      donePoints,
      completionPct: totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0,
    };
  }, [sprint]);

  useEffect(() => {
    if (allProjectRequirements.length > 0) {
      setExpandedReqs(prev => {
        const next = { ...prev };
        allProjectRequirements.forEach(requirement => {
          if (next[requirement.id] === undefined) next[requirement.id] = false;
        });
        return next;
      });
    }
  }, [allProjectRequirements]);

  /* ---------------- Home ---------------- */

  if (!currentProject) {
    return (
      <div className="mx-auto max-w-6xl animate-rise space-y-6">
        <section className="card relative overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-soft blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[#f6b544] text-xl font-bold text-white">
                {user?.fullName.charAt(0)}
              </span>
              <div>
                <p className="label-xs">Workspace</p>
                <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{user?.fullName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="chip border-line bg-surface-2 text-ink-soft">{user?.email}</span>
                  <span
                    className={`chip uppercase ${
                      user?.role === 'ADMINISTRATOR'
                        ? 'border-brand/25 bg-brand-soft text-brand'
                        : 'border-leaf/25 bg-leaf-soft text-leaf'
                    }`}
                  >
                    {user?.role === 'ADMINISTRATOR' && <ShieldCheck size={11} />}
                    {user?.role}
                  </span>
                  <span className="chip border-line bg-surface-2 text-ink-soft tnum">
                    Capacity {user?.capacityPoints} SP
                  </span>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setIsCreateProjOpen(true)} className="btn-primary px-4 py-2.5">
              <Plus size={15} />
              New project
            </button>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FolderOpen size={15} className="text-brand" />
                Owned by you
              </h2>
              <span className="chip border-brand/25 bg-brand-soft text-brand tnum">{ownedProjects.length}</span>
            </div>

            <div className="space-y-3">
              {ownedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  name={project.name}
                  description={project.description}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  role="Owner"
                  onClick={() => setCurrentProject(project)}
                />
              ))}
              {ownedProjects.length === 0 && (
                <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 p-8 text-center">
                  <p className="text-xs text-ink-soft">No projects yet.</p>
                  <p className="mt-1 text-[10px] text-ink-faint">Create one and you become its owner.</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Users size={15} className="text-leaf" />
                Shared with you
              </h2>
              <span className="chip border-leaf/25 bg-leaf-soft text-leaf tnum">{memberProjects.length}</span>
            </div>

            <div className="space-y-3">
              {memberProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  name={project.name}
                  description={project.description}
                  startDate={project.startDate}
                  endDate={project.endDate}
                  role="Member"
                  onClick={() => setCurrentProject(project)}
                />
              ))}
              {memberProjects.length === 0 && (
                <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 p-8 text-center">
                  <p className="text-xs text-ink-soft">Nothing shared yet.</p>
                  <p className="mt-1 text-[10px] text-ink-faint">Projects appear here once an owner invites you.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {isCreateProjOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
                <h3 className="font-display text-lg font-semibold text-ink">New project</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateProjOpen(false)}
                  className="text-lg leading-none text-ink-faint transition hover:text-ink"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 p-5">
                {createError && (
                  <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
                    {createError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="label-xs">Project name</label>
                  <input
                    type="text"
                    required
                    value={newProjName}
                    onChange={event => setNewProjName(event.target.value)}
                    placeholder="e.g. Apollo payment gateway"
                    className="input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="label-xs">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={newProjDesc}
                    onChange={event => setNewProjDesc(event.target.value)}
                    placeholder="Objectives and timeline"
                    className="input resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-line pt-4">
                  <button type="button" onClick={() => setIsCreateProjOpen(false)} className="btn-quiet">
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreatingProj} className="btn-primary">
                    {isCreatingProj ? <Loader2 size={14} className="animate-spin" /> : 'Create project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- Workspace ---------------- */

  const isProjOwner = currentProject.owner?.id === user?.id || user?.role === 'ADMINISTRATOR';
  const healthScore = sprint?.healthScore ?? null;
  const healthTone =
    healthScore === null
      ? 'text-ink-faint'
      : healthScore >= 80
        ? 'text-leaf'
        : healthScore >= 50
          ? 'text-brand'
          : 'text-danger';

  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = healthScore === null ? gaugeCircumference : gaugeCircumference * (1 - Math.min(100, Math.max(0, healthScore)) / 100);

  const handleCompleteSprint = async (sprintId: number) => {
    setActionError('');
    try {
      await completeSprint(sprintId);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Could not close that sprint.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 animate-rise">
      {/* Workspace header */}
      <section className="card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setCurrentProject(null)}
              className="mb-3 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-faint transition hover:text-brand"
            >
              <ArrowLeft size={12} />
              All projects
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{currentProject.name}</h1>
              <span
                className={`chip uppercase tracking-[0.08em] ${
                  isProjOwner ? 'border-brand/25 bg-brand-soft text-brand' : 'border-leaf/25 bg-leaf-soft text-leaf'
                }`}
              >
                {isProjOwner ? 'Owner' : 'Member'}
              </span>
              <button type="button" onClick={refreshData} className="chip border-line bg-surface-2 text-ink-soft hover:text-ink">
                Sync
              </button>
            </div>

            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-ink-soft">{currentProject.description}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-1 rounded-xl border border-line bg-surface-2 p-1">
            {(
              [
                ['A', 'Board'],
                ['B', 'Backlog'],
                ['C', 'Metrics'],
                ['D', 'Team'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                data-active={activeTab === key}
                className="tab"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-xs text-ink-faint">
          <Loader2 size={15} className="animate-spin" />
          Loading workspace…
        </div>
      ) : (
        <div className="min-h-[420px]">
          {/* Board */}
          {activeTab === 'A' && (
            <div className="card p-4 sm:p-5">
              <KanbanBoard />
            </div>
          )}

          {/* Backlog */}
          {activeTab === 'B' && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="space-y-4 xl:col-span-2">
                <section className="card p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">Backlog</h3>
                      <p className="text-[11px] text-ink-faint">Requirements group the tasks that reach the board.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setIsAiModalOpen(true)} className="btn-quiet">
                        <Sparkles size={14} className="text-brand" />
                        Decompose PRD
                      </button>
                      {isProjOwner && (
                        <button type="button" onClick={() => setIsAddingReq(value => !value)} className="btn-primary">
                          <Plus size={14} />
                          Requirement
                        </button>
                      )}
                    </div>
                  </div>

                  {isAddingReq && (
                    <form onSubmit={handleAddRequirement} className="mb-4 space-y-3 rounded-xl border border-line bg-surface-2 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">New requirement</span>
                        <button type="button" onClick={() => setIsAddingReq(false)} className="text-xs text-ink-faint hover:text-ink">
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="label-xs">Title</label>
                          <input
                            type="text"
                            required
                            value={newReqTitle}
                            onChange={event => setNewReqTitle(event.target.value)}
                            placeholder="e.g. Stripe integration"
                            className="input"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="label-xs">Label colour</label>
                          <select
                            value={newReqColor}
                            onChange={event => setNewReqColor(event.target.value)}
                            className="input cursor-pointer"
                          >
                            <option value="#e2560e">Orange</option>
                            <option value="#4f7c12">Leaf green</option>
                            <option value="#0f766e">Teal</option>
                            <option value="#b3261e">Brick</option>
                            <option value="#a16207">Ochre</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="label-xs">Description</label>
                          <input
                            type="text"
                            value={newReqDesc}
                            onChange={event => setNewReqDesc(event.target.value)}
                            placeholder="Short note on scope"
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" disabled={newReqTitle.trim().length === 0} className="btn-primary">
                          Save requirement
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2.5">
                    {allProjectRequirements.map(requirement => {
                      const reqTasks = requirement.tasks || [];
                      const isExpanded = !!expandedReqs[requirement.id];
                      const allDone = reqTasks.length > 0 && reqTasks.every(task => task.status === 'DONE');

                      return (
                        <div key={requirement.id} className="overflow-hidden rounded-xl border border-line">
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-2 px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={allDone}
                                onChange={() => handleToggleRequirementCheckbox(reqTasks)}
                                aria-label={`Mark ${requirement.title} complete`}
                                className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--brand)]"
                              />
                              <button
                                type="button"
                                onClick={() => toggleReqExpand(requirement.id)}
                                className="text-ink-faint transition hover:text-ink"
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </button>
                              <span className="h-6 w-1.5 shrink-0 rounded" style={{ backgroundColor: requirement.color }} />
                              <div className="min-w-0">
                                <h4 className="truncate text-xs font-semibold text-ink">{requirement.title}</h4>
                                <p className="truncate text-[10px] text-ink-faint">{requirement.description || 'No description'}</p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {requirement.sprintId ? (
                                <span className="chip border-brand/25 bg-brand-soft text-brand">In sprint</span>
                              ) : (
                                <span className="chip border-line bg-surface text-ink-soft">Backlog</span>
                              )}
                              {isProjOwner && (
                                <button
                                  type="button"
                                  onClick={() => setActiveReqForSubtask(requirement.id)}
                                  className="text-[10px] font-semibold text-brand hover:underline"
                                >
                                  + task
                                </button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="divide-y divide-line bg-surface">
                              {reqTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                                  <div className="flex min-w-0 items-center gap-2.5 pl-6">
                                    <input
                                      type="checkbox"
                                      checked={task.status === 'DONE'}
                                      onChange={() => handleToggleSubtaskCheckbox(task.id, task.status)}
                                      aria-label={`Mark ${task.title} complete`}
                                      className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[var(--brand)]"
                                    />
                                    <span
                                      className={`truncate text-[11px] font-medium ${
                                        task.status === 'DONE' ? 'text-ink-faint line-through' : 'text-ink'
                                      }`}
                                    >
                                      {task.title}
                                    </span>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-2 text-[10px]">
                                    {task.assignee ? (
                                      <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium text-ink-soft">
                                        {task.assignee.fullName}
                                      </span>
                                    ) : (
                                      <span className="italic text-ink-faint">Unassigned</span>
                                    )}
                                    <span className="rounded border border-line px-1.5 py-0.5 font-bold text-ink-soft tnum">
                                      {task.effortPoints} SP
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {reqTasks.length === 0 && (
                                <p className="py-3 text-center text-[10px] italic text-ink-faint">No tasks yet.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {allProjectRequirements.length === 0 && (
                      <p className="py-8 text-center text-xs italic text-ink-faint">
                        Nothing in the backlog. Add a requirement or decompose a PRD.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className="card p-5">
                  <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                    <Play size={16} className="text-brand" />
                    Sprint
                  </h3>

                  {sprint ? (
                    <div className="mt-3 space-y-2 rounded-xl border border-brand/20 bg-brand-soft/60 p-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                        <AlertTriangle size={14} />
                        Sprint in progress
                      </div>
                      <p className="text-[11px] leading-relaxed text-ink-soft">
                        <strong className="text-ink">{sprint.name}</strong> is active. Close it before starting another.
                      </p>
                      {isProjOwner && (
                        <button
                          type="button"
                          onClick={() => handleCompleteSprint(sprint.id)}
                          className="mt-1 w-full rounded-lg border border-danger/30 bg-surface py-2 text-xs font-semibold text-danger transition hover:bg-danger-soft"
                        >
                          Close sprint
                        </button>
                      )}
                    </div>
                  ) : !isProjOwner ? (
                    <p className="mt-3 text-xs italic text-ink-faint">Only the project owner can start a sprint.</p>
                  ) : (
                    <form onSubmit={handleInitializeSprint} className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <label className="label-xs">Objective</label>
                        <input
                          type="text"
                          required
                          value={sprintObjective}
                          onChange={event => setSprintObjective(event.target.value)}
                          placeholder="e.g. Beta payments flow"
                          className="input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="label-xs">Start</label>
                          <input
                            type="date"
                            required
                            value={sprintStart}
                            onChange={event => setSprintStart(event.target.value)}
                            className="input cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="label-xs">End</label>
                          <input
                            type="date"
                            required
                            value={sprintEnd}
                            onChange={event => setSprintEnd(event.target.value)}
                            className="input cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="label-xs">Sprint scope</span>
                        <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-surface-2 p-2.5">
                          {allProjectRequirements
                            .filter(requirement => !requirement.sprintId)
                            .map(requirement => (
                              <label key={requirement.id} className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft">
                                <input
                                  type="checkbox"
                                  checked={selectedReqIds.includes(requirement.id)}
                                  onChange={event => {
                                    if (event.target.checked) setSelectedReqIds(prev => [...prev, requirement.id]);
                                    else setSelectedReqIds(prev => prev.filter(id => id !== requirement.id));
                                  }}
                                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand)]"
                                />
                                <span className="truncate">{requirement.title}</span>
                              </label>
                            ))}
                          {allProjectRequirements.filter(requirement => !requirement.sprintId).length === 0 && (
                            <p className="py-2 text-center text-[10px] italic text-ink-faint">No backlog requirements available.</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCreatingSprint || selectedReqIds.length === 0}
                        className="btn-primary w-full py-2.5"
                      >
                        {isCreatingSprint ? 'Starting…' : 'Start sprint'}
                      </button>
                    </form>
                  )}
                </section>

                {activeReqForSubtask !== null && (
                  <section className="card p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold text-ink">New task</h3>
                      <button type="button" onClick={() => setActiveReqForSubtask(null)} className="text-xs text-ink-faint hover:text-ink">
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleAddSubtask} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="label-xs">Title</label>
                        <input
                          type="text"
                          required
                          value={newSubtaskTitle}
                          onChange={event => setNewSubtaskTitle(event.target.value)}
                          placeholder="e.g. Write integration tests"
                          className="input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="label-xs">Points</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={newSubtaskSP}
                            onChange={event => setNewSubtaskSP(parseInt(event.target.value) || 1)}
                            className="input text-center tnum"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="label-xs">Assignee</label>
                          <select
                            value={newSubtaskAssignee}
                            onChange={event => setNewSubtaskAssignee(event.target.value ? Number(event.target.value) : '')}
                            className="input cursor-pointer"
                          >
                            <option value="">Unassigned</option>
                            {members.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" disabled={isAddingSubtask} className="btn-primary w-full">
                        {isAddingSubtask ? 'Adding…' : 'Add task'}
                      </button>
                    </form>
                  </section>
                )}
              </div>
            </div>
          )}

          {/* Metrics */}
          {activeTab === 'C' && (
            <div className="space-y-5">
              {sprint ? (
                <>
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <section className="card p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <TrendingDown size={16} className="text-brand" />
                          Burndown
                        </h3>
                        <span className="text-[10px] text-ink-faint">Remaining story points</span>
                      </div>
                      <div className="h-60">
                        {burndownData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={burndownData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                              <defs>
                                <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={brandLine} stopOpacity={0.22} />
                                  <stop offset="100%" stopColor={brandLine} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                              <XAxis dataKey="day" stroke={chartAxis} fontSize={10} tickLine={false} />
                              <YAxis stroke={chartAxis} fontSize={10} tickLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={chartTooltip} />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Area
                                name="Ideal"
                                type="linear"
                                dataKey="Ideal"
                                stroke={chartAxis}
                                strokeDasharray="5 4"
                                fill="none"
                                strokeWidth={1.5}
                              />
                              <Area
                                name="Remaining"
                                type="stepAfter"
                                dataKey="Actual"
                                stroke={brandLine}
                                strokeWidth={2}
                                fill="url(#actualFill)"
                                connectNulls={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs italic text-ink-faint">
                            No sprint dates to plot yet.
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
                        The remaining line is replayed from recorded task status changes; the dashed line is the ideal
                        straight burn from {metrics?.activeSprintTotalPoints ?? 0} points.
                      </p>
                    </section>

                    <section className="card p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <BarChart4 size={16} className="text-leaf" />
                          Points by column
                        </h3>
                        <span className="text-[10px] text-ink-faint">Story points</span>
                      </div>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={distributionData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                            <XAxis dataKey="name" stroke={chartAxis} fontSize={10} tickLine={false} />
                            <YAxis stroke={chartAxis} fontSize={10} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={chartTooltip} />
                            <Bar dataKey="points" name="Story points" radius={[5, 5, 0, 0]} maxBarSize={56}>
                              {distributionData.map(entry => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <section className="card flex flex-col items-center p-5 text-center">
                      <h4 className="label-xs">Sprint health</h4>

                      <div className="relative mt-4 h-36 w-36">
                        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
                          <circle cx="64" cy="64" r={gaugeRadius} fill="none" stroke="var(--line)" strokeWidth="10" />
                          <circle
                            cx="64"
                            cy="64"
                            r={gaugeRadius}
                            fill="none"
                            stroke={healthScore === null ? 'transparent' : 'var(--brand)'}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={gaugeCircumference}
                            strokeDashoffset={gaugeOffset}
                            style={{ transition: 'stroke-dashoffset 700ms ease' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`font-display text-3xl font-semibold tnum ${healthTone}`}>
                            {healthScore === null ? '—' : `${healthScore}%`}
                          </span>
                          <span className="label-xs mt-1">Score</span>
                        </div>
                      </div>

                      <p className="mt-4 max-w-[230px] text-[11px] leading-relaxed text-ink-soft">
                        {healthScore === null
                          ? 'The metrics endpoint has not scored this sprint yet.'
                          : healthScore >= 80
                            ? 'Delivery is on track: load is balanced and timing matches the remaining work.'
                            : healthScore >= 50
                              ? 'Some risk: load or timing is drifting from the committed plan.'
                              : 'High risk: remaining work outweighs the sprint timing and available capacity.'}
                      </p>

                      <p className="mt-3 text-[10px] text-ink-faint">
                        40% velocity · 30% workload balance · 30% timing
                      </p>
                    </section>

                    <section className="card p-5 lg:col-span-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <BarChart4 size={16} className="text-brand" />
                        Progress
                      </h3>

                      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                        {[
                          { label: 'To Do', value: sprintProgress.todoTasks, tone: 'text-ink-soft' },
                          { label: 'In Progress', value: sprintProgress.inProgressTasks, tone: 'text-brand' },
                          { label: 'Done', value: sprintProgress.doneTasks, tone: 'text-leaf' },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-xl border border-line bg-surface-2 p-3">
                            <span className={`block font-display text-2xl font-semibold tnum ${stat.tone}`}>{stat.value}</span>
                            <span className="label-xs mt-0.5">{stat.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                          <span>Story point completion</span>
                          <span className="tnum">
                            {sprintProgress.donePoints} / {sprintProgress.totalPoints} SP
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-2">
                          <div
                            className="h-full rounded-full bg-leaf transition-all duration-500"
                            style={{ width: `${sprintProgress.completionPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-ink-faint tnum">
                          {sprintProgress.completionPct}% complete across {sprintProgress.totalTasks} tasks.
                        </p>
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <div className="card flex flex-col items-center justify-center p-12 text-center">
                  <BarChart4 size={30} className="mb-3 text-ink-faint" />
                  <p className="text-sm text-ink-soft">No active sprint</p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Metrics appear once a sprint is started in the Backlog tab.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Team */}
          {activeTab === 'D' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <section className="card p-5 lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-ink">Contributors</h3>

                <div className="divide-y divide-line">
                  {members.map(member => {
                    const isExpanded = !!expandedMembers[member.id];
                    const userTasks: any[] = [];
                    const seen = new Set<number>();

                    sprint?.subtasks.forEach(task => {
                      if (task.assignee?.id === member.id) {
                        userTasks.push(task);
                        seen.add(task.id);
                      }
                    });

                    allProjectRequirements.forEach(requirement => {
                      requirement.tasks?.forEach(task => {
                        if ((task.assignee?.id === member.id || task.assigneeId === member.id) && !seen.has(task.id)) {
                          userTasks.push(task);
                          seen.add(task.id);
                        }
                      });
                    });

                    const totalPoints = userTasks.reduce((sum, task) => sum + (task.effortPoints || 0), 0);
                    const doneTasks = userTasks.filter(task => task.status === 'DONE');
                    const utilization =
                      member.capacityPoints > 0 ? Math.round((totalPoints / member.capacityPoints) * 100) : 0;

                    return (
                      <div key={member.id} className="py-1">
                        <button
                          type="button"
                          onClick={() => setExpandedMembers(prev => ({ ...prev, [member.id]: !prev[member.id] }))}
                          className="flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left transition hover:bg-surface-2"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#f6b544] text-xs font-bold uppercase text-white">
                              {member.fullName.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <h4 className="truncate text-xs font-semibold text-ink">{member.fullName}</h4>
                              <p className="truncate text-[10px] text-ink-faint">{member.email}</p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`chip uppercase ${
                                member.role === 'OWNER'
                                  ? 'border-brand/25 bg-brand-soft text-brand'
                                  : 'border-leaf/25 bg-leaf-soft text-leaf'
                              }`}
                            >
                              {member.role}
                            </span>
                            <span className="chip border-line bg-surface-2 text-ink-soft tnum">
                              {totalPoints}/{member.capacityPoints} SP
                            </span>
                            {isExpanded ? (
                              <ChevronDown size={15} className="text-ink-faint" />
                            ) : (
                              <ChevronRight size={15} className="text-ink-faint" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="space-y-3 pb-3 pl-14 pr-2 pt-1 text-xs text-ink-soft">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                                <span>Capacity used</span>
                                <span className="tnum">
                                  {utilization}% ({totalPoints}/{member.capacityPoints} SP)
                                </span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    utilization > 100 ? 'bg-danger' : utilization > 80 ? 'bg-brand' : 'bg-leaf'
                                  }`}
                                  style={{ width: `${Math.min(100, utilization)}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 rounded-lg border border-line bg-surface-2 py-2 text-center text-[10px]">
                              <div>
                                <span className="block text-sm font-bold text-ink tnum">{userTasks.length}</span>
                                <span className="label-xs">Total</span>
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-leaf tnum">{doneTasks.length}</span>
                                <span className="label-xs">Done</span>
                              </div>
                              <div>
                                <span className="block text-sm font-bold text-brand tnum">
                                  {userTasks.filter(task => task.status === 'IN_PROGRESS').length}
                                </span>
                                <span className="label-xs">Doing</span>
                              </div>
                            </div>

                            <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                              {userTasks.map(task => {
                                const requirementTitle =
                                  allProjectRequirements.find(requirement => requirement.id === task.requirementId)?.title || 'Task';
                                const statusTone: Record<TaskStatus, string> = {
                                  TODO: 'border-line bg-surface-2 text-ink-soft',
                                  IN_PROGRESS: 'border-brand/25 bg-brand-soft text-brand',
                                  DONE: 'border-leaf/25 bg-leaf-soft text-leaf',
                                };
                                return (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-2.5 py-1.5"
                                  >
                                    <div className="min-w-0">
                                      <div className="truncate text-[11px] font-medium text-ink">{task.title}</div>
                                      <div className="truncate text-[9px] text-ink-faint">{requirementTitle}</div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      <span className={`chip uppercase ${statusTone[task.status as TaskStatus]}`}>
                                        {String(task.status).replace('_', ' ')}
                                      </span>
                                      <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold text-ink-soft tnum">
                                        {task.effortPoints} SP
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {userTasks.length === 0 && (
                                <p className="py-2 text-center text-[10px] italic text-ink-faint">No tasks assigned.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <p className="py-6 text-center text-xs italic text-ink-faint">No contributors yet.</p>
                  )}
                </div>
              </section>

              <section className="card h-fit p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <UserPlus size={15} className="text-brand" />
                  Invite a collaborator
                </h3>

                {isProjOwner ? (
                  <form onSubmit={handleInviteMember} className="mt-3 space-y-3">
                    {inviteMsg && (
                      <div
                        className={`rounded-lg border px-3 py-2 text-xs ${
                          inviteMsg.type === 'success'
                            ? 'border-leaf/30 bg-leaf-soft text-leaf'
                            : 'border-danger/30 bg-danger-soft text-danger'
                        }`}
                      >
                        {inviteMsg.text}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="label-xs">Email</label>
                      <div className="relative">
                        <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={event => setInviteEmail(event.target.value)}
                          placeholder="collaborator@company.com"
                          className="input pl-9"
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={isInviting} className="btn-primary w-full py-2.5">
                      <UserPlus size={14} />
                      {isInviting ? 'Inviting…' : 'Invite member'}
                    </button>

                    <p className="text-[10px] leading-relaxed text-ink-faint">
                      Invited accounts join as members of this project only.
                    </p>
                  </form>
                ) : (
                  <p className="mt-3 text-xs italic text-ink-faint">Only the project owner can invite people.</p>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {currentProject && (
        <BacklogPdfUploadModal
          projectId={currentProject.id}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onBacklogGenerated={() => {
            void refreshData();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
