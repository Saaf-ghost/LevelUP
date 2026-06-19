import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Project {
  id: number;
  name: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  skills: string[];
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  color: string;
  status: TaskStatus;
  storyPoints: number;
}

export interface Subtask {
  id: string;
  requirementId: string;
  title: string;
  status: TaskStatus;
  assigneeId?: string;
  storyPoints: number;
  timeInColumn: number;
}

export interface AiInsight {
  id: string;
  type: 'RISK_WARNING' | 'REASSIGNMENT_SUGGESTION' | 'RETROSPECTIVE';
  title: string;
  description: string;
  rationale?: string;
  suggestedAction?: string;
  impact?: string;
}

export interface SprintData {
  id: string;
  name: string;
  objectives: string;
  healthScore: number;
  startDate: string;
  endDate: string;
  requirements: Requirement[];
  subtasks: Subtask[];
  insights: AiInsight[];
}

interface SprintContextType {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  sprint: SprintData | null;
  loading: boolean;
  members: TeamMember[];
  refreshData: () => Promise<void>;
  updateSubtaskStatus: (subtaskId: string, newStatus: TaskStatus) => Promise<void>;
  addNewSubtask: (requirementId: string, title: string, storyPoints: number, assigneeId?: string) => Promise<void>;
  createNewSprint: (
    title: string,
    objectives: string,
    startDate: string,
    endDate: string,
    pointsPlanned: number,
    requirementsInput?: {
      title: string;
      subtasks: {
        title: string;
        storyPoints: number;
        assigneeId?: string;
      }[];
    }[],
    status?: 'ACTIVE' | 'PLANNED'
  ) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
}

const SprintContext = createContext<SprintContextType | undefined>(undefined);

export const SprintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get<any[]>('/projects');
      const formattedProjects = res.data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      }));
      setProjects(formattedProjects);
      return formattedProjects;
    } catch (err) {
      console.error('Failed to load projects', err);
      return [];
    }
  }, []);

  const loadProjectDetail = useCallback(async (projectId: number) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/projects/${projectId}/detail`);
      const data = res.data;

      // Map members
      const mappedMembers: TeamMember[] = (data.members || []).map((m: any) => ({
        id: String(m.id),
        name: m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Unknown',
        avatar: m.avatarUrl || `https://i.pravatar.cc/150?u=${m.id}`,
        skills: m.skills ? m.skills.split(',').map((s: string) => s.trim()) : ['Developer']
      }));
      setMembers(mappedMembers);

      // Map active sprint
      if (data.activeSprint) {
        const activeSprint = data.activeSprint;
        const tasks = data.activeSprintTasks || [];

        // Map subtasks
        const mappedSubtasks: Subtask[] = tasks.map((t: any) => ({
          id: String(t.id),
          requirementId: t.requirement ? String(t.requirement.id) : '',
          title: t.title,
          status: (t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'DONE') ? t.status : 'TODO',
          assigneeId: t.assignee ? String(t.assignee.id) : undefined,
          storyPoints: t.effortPoints || 0,
          timeInColumn: 0
        }));

        // Expose requirements inside activeSprint or load from backend
        // We'll extract unique requirements from activeSprintTasks and merge with any empty ones
        const uniqueReqMap = new Map<string, Requirement>();
        
        // Add all requirements that are associated with tasks
        tasks.forEach((t: any) => {
          if (t.requirement) {
            const reqId = String(t.requirement.id);
            if (!uniqueReqMap.has(reqId)) {
              uniqueReqMap.set(reqId, {
                id: reqId,
                title: t.requirement.title,
                description: t.requirement.description || '',
                color: t.requirement.color || '#3b82f6',
                status: 'TODO',
                storyPoints: 0
              });
            }
          }
        });

        // Also fetch project requirements directly to ensure we have all of them
        try {
          const reqRes = await api.get<any[]>(`/requirements/sprint/${activeSprint.sprintId}`);
          reqRes.data.forEach(r => {
            const reqId = String(r.id);
            if (!uniqueReqMap.has(reqId)) {
              uniqueReqMap.set(reqId, {
                id: reqId,
                title: r.title,
                description: r.description || '',
                color: r.color || '#3b82f6',
                status: 'TODO',
                storyPoints: 0
              });
            }
          });
        } catch (reqErr) {
          console.warn('Failed to load requirement objects', reqErr);
        }

        const mappedRequirements = Array.from(uniqueReqMap.values());

        // Recalculate requirement totals
        mappedRequirements.forEach(req => {
          const linked = mappedSubtasks.filter(s => s.requirementId === req.id);
          req.storyPoints = linked.reduce((sum, s) => sum + s.storyPoints, 0);
          if (linked.length > 0) {
            if (linked.every(s => s.status === 'DONE')) req.status = 'DONE';
            else if (linked.some(s => s.status === 'IN_PROGRESS')) req.status = 'IN_PROGRESS';
            else req.status = 'TODO';
          }
        });

        // Load AI Insights
        let mappedInsights: AiInsight[] = [];
        try {
          const insightRes = await api.get<any[]>(`/ai/sprint/${activeSprint.sprintId}`);
          mappedInsights = insightRes.data.map(ins => ({
            id: String(ins.id),
            type: ins.insightType === 'RISK_ALERT' ? 'RISK_WARNING' 
                  : ins.insightType === 'REASSIGNMENT_SUGGESTION' ? 'REASSIGNMENT_SUGGESTION' 
                  : 'RETROSPECTIVE',
            title: ins.insightType === 'RISK_ALERT' ? 'Sprint Risk Warning' 
                   : ins.insightType === 'REASSIGNMENT_SUGGESTION' ? 'Reassignment Suggestion' 
                   : 'Historical Pattern Analysis',
            description: ins.explanation,
            rationale: ins.explanation.substring(0, 100) + '...'
          }));
        } catch (insErr) {
          console.warn('Failed to load AI Insights', insErr);
        }

        // Fetch Health Score
        let healthScore = 100;
        try {
          const healthRes = await api.get<any>(`/sprints/${activeSprint.sprintId}/health`);
          healthScore = healthRes.data.score || 100;
        } catch (healthErr) {
          console.warn('Failed to load health score', healthErr);
        }

        setSprint({
          id: String(activeSprint.sprintId),
          name: activeSprint.objective || `Sprint ${activeSprint.sprintId}`,
          objectives: activeSprint.objective || '',
          healthScore: healthScore,
          startDate: activeSprint.startDate,
          endDate: activeSprint.endDate,
          requirements: mappedRequirements,
          subtasks: mappedSubtasks,
          insights: mappedInsights
        });
      } else {
        setSprint(null);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
      setSprint(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem('levelup_current_project_id', String(project.id));
      loadProjectDetail(project.id);
    } else {
      localStorage.removeItem('levelup_current_project_id');
      setSprint(null);
    }
  }, [loadProjectDetail]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    const list = await loadProjects();
    if (list.length > 0) {
      let activeProj = currentProject;
      if (!activeProj) {
        const storedId = localStorage.getItem('levelup_current_project_id');
        if (storedId) {
          activeProj = list.find(p => String(p.id) === storedId) || list[0];
        } else {
          activeProj = list[0];
        }
      }
      setCurrentProject(activeProj);
    } else {
      setCurrentProjectState(null);
      setSprint(null);
    }
  }, [isAuthenticated, loadProjects, currentProject, setCurrentProject]);

  useEffect(() => {
    refreshData();
  }, [isAuthenticated]);

  const updateSubtaskStatus = async (subtaskId: string, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${subtaskId}/status`, { status: newStatus });
      if (currentProject) {
        await loadProjectDetail(currentProject.id);
      }
    } catch (err) {
      console.error('Failed to update subtask status', err);
    }
  };

  const addNewSubtask = async (requirementId: string, title: string, storyPoints: number, assigneeId?: string) => {
    if (!sprint) return;
    try {
      await api.post('/tasks', {
        title,
        description: `Subtask for requirement ${requirementId}`,
        priority: 'MEDIUM',
        status: 'TODO',
        effortPoints: storyPoints,
        estimatedHours: storyPoints * 4,
        sprintId: Number(sprint.id),
        requirementId: Number(requirementId),
        assigneeId: assigneeId && assigneeId.trim() !== '' ? Number(assigneeId) : null
      });
      if (currentProject) {
        await loadProjectDetail(currentProject.id);
      }
    } catch (err) {
      console.error('Failed to add subtask', err);
    }
  };

  const createNewSprint = async (
    title: string,
    objectives: string,
    startDate: string,
    endDate: string,
    pointsPlanned: number,
    requirementsInput?: {
      title: string;
      subtasks: {
        title: string;
        storyPoints: number;
        assigneeId?: string;
      }[];
    }[],
    status?: 'ACTIVE' | 'PLANNED'
  ) => {
    if (!currentProject) return;
    try {
      const resolvedStatus = status || (sprint ? 'PLANNED' : 'ACTIVE');
      const res = await api.post('/sprints', {
        objective: objectives || title,
        startDate,
        endDate,
        sprintStatus: resolvedStatus,
        pointsPlanned,
        projectId: currentProject.id
      });
      const createdSprint = res.data;
      const sprintId = createdSprint.sprintId;

      if (requirementsInput && requirementsInput.length > 0) {
        const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
        for (let i = 0; i < requirementsInput.length; i++) {
          const req = requirementsInput[i];
          const color = COLORS[i % COLORS.length];
          const reqRes = await api.post('/requirements', {
            title: req.title || `Requirement ${i + 1}`,
            description: '',
            color,
            sprintId
          });
          const createdReq = reqRes.data;
          const requirementId = createdReq.id;

          for (const sub of req.subtasks) {
            const parsedAssigneeId = sub.assigneeId && sub.assigneeId.trim() !== ''
              ? Number(sub.assigneeId)
              : null;
            await api.post('/tasks', {
              title: sub.title || 'Untitled Subtask',
              description: '',
              priority: 'MEDIUM',
              status: 'TODO',
              effortPoints: sub.storyPoints || 0,
              estimatedHours: (sub.storyPoints || 0) * 4,
              sprintId,
              requirementId,
              assigneeId: parsedAssigneeId
            });
          }
        }
      }

      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error('Failed to create sprint', err);
      throw err;
    }
  };

  const completeSprint = async (sprintId: string) => {
    try {
      await api.patch(`/sprints/${sprintId}/complete`);
      if (currentProject) {
        await loadProjectDetail(currentProject.id);
      }
    } catch (err) {
      console.error('Failed to complete sprint', err);
      throw err;
    }
  };

  const createProject = async (name: string, description: string): Promise<Project> => {
    try {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);

      const startDate = today.toISOString().split('T')[0];
      const endDate = nextYear.toISOString().split('T')[0];

      const res = await api.post<any>('/projects', {
        name,
        description,
        startDate,
        endDate,
        status: 'PLANNED'
      });
      const newProj: Project = {
        id: res.data.id,
        name: res.data.name,
        description: res.data.description
      };
      setProjects(prev => [...prev, newProj]);
      setCurrentProject(newProj);
      return newProj;
    } catch (err) {
      console.error('Failed to create project', err);
      throw err;
    }
  };

  return (
    <SprintContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject,
      sprint,
      loading,
      members,
      refreshData,
      updateSubtaskStatus,
      addNewSubtask,
      createNewSprint,
      completeSprint,
      createProject
    }}>
      {children}
    </SprintContext.Provider>
  );
};

export const useSprint = () => {
  const context = useContext(SprintContext);
  if (context === undefined) {
    throw new Error('useSprint must be used within a SprintProvider');
  }
  return context;
};
