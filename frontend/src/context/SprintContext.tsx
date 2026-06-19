import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER' | 'ADMIN';
  capacityPoints: number;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  owner?: User;
  members?: User[];
  requirements?: Requirement[];
  sprints?: SprintInfo[];
}

export interface Requirement {
  id: number;
  title: string;
  description: string;
  color: string;
  status: TaskStatus;
  storyPoints: number;
  sprintId?: number | null;
  tasks?: Subtask[];
}

export interface Subtask {
  id: number;
  requirementId: number;
  title: string;
  description?: string;
  priority: string;
  status: TaskStatus;
  isCompleted: boolean;
  effortPoints: number;
  estimatedHours: number;
  assigneeId?: number | null;
  assignee?: User | null;
  statusChangedAt?: string;
}

export interface AiInsight {
  id: number;
  explanation: string;
  confidenceScore: number;
  acknowledged: boolean;
  insightType: 'RISK_ALERT' | 'REASSIGNMENT_SUGGESTION' | 'RETROSPECTIVE';
  sprintHealthScore: number;
  riskLevel: string;
  bottlenecksJson?: string;
  automatedStandupSummary?: string;
}

export interface SprintInfo {
  sprintId: number;
  objective: string;
  startDate: string;
  endDate: string;
  sprintStatus: 'PLANNED' | 'ACTIVE' | 'DONE';
  pointsPlanned: number;
  isActive: boolean;
  isConcluded: boolean;
}

export interface SprintData {
  id: number;
  name: string;
  objectives: string;
  healthScore: number;
  startDate: string;
  endDate: string;
  requirements: Requirement[];
  subtasks: Subtask[];
  insights: AiInsight[];
  sprintStatus: 'PLANNED' | 'ACTIVE' | 'DONE';
}

interface SprintContextType {
  projects: Project[];
  ownedProjects: Project[];
  memberProjects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  sprint: SprintData | null;
  loading: boolean;
  members: User[];
  allProjectRequirements: Requirement[];
  refreshData: () => Promise<void>;
  updateSubtaskStatus: (subtaskId: number, newStatus: TaskStatus) => Promise<void>;
  addNewRequirement: (title: string, description: string, color: string) => Promise<void>;
  addNewSubtask: (requirementId: number, title: string, storyPoints: number, assigneeId?: number | null) => Promise<void>;
  createNewSprint: (
    objective: string,
    startDate: string,
    endDate: string,
    plannedStoryPoints: number,
    requirementIds: number[]
  ) => Promise<void>;
  completeSprint: (sprintId: number) => Promise<void>;
  createProject: (name: string, description: string) => Promise<Project>;
  inviteMember: (email: string) => Promise<void>;
}

const SprintContext = createContext<SprintContextType | undefined>(undefined);

export const SprintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [memberProjects, setMemberProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [allProjectRequirements, setAllProjectRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadProjects = useCallback(async () => {
    if (!user) return [];
    try {
      const res = await api.get<any>(`/home?userId=${user.id}`);
      const owned = (res.data.ownedProjects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        owner: p.owner,
        members: p.members
      }));
      const member = (res.data.memberProjects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        owner: p.owner,
        members: p.members
      }));
      setOwnedProjects(owned);
      setMemberProjects(member);
      const combined = [...owned, ...member];
      setProjects(combined);
      return combined;
    } catch (err) {
      console.error('Failed to load projects via home API', err);
      return [];
    }
  }, [user]);

  const loadProjectDetail = useCallback(async (projectId: number) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/projects/${projectId}/detail`);
      const data = res.data;

      // Update current project local details
      const detailProj: Project = {
        id: data.project.id,
        name: data.project.name,
        description: data.project.description,
        startDate: data.project.startDate,
        endDate: data.project.endDate,
        status: data.project.status,
        owner: data.project.owner,
      };
      setCurrentProjectState(detailProj);

      // Fetch ALL project requirements from dedicated endpoint (includes backlog ones)
      let mappedReqs: Requirement[] = [];
      try {
        const reqsRes = await api.get<any[]>(`/projects/${projectId}/requirements`);
        mappedReqs = (reqsRes.data || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          color: r.color || '#6366F1',
          status: r.status || 'BACKLOG',
          storyPoints: r.storyPoints || 0,
          sprintId: r.sprint ? r.sprint.sprintId : null,
          tasks: (r.subtasks || r.tasks || []).map((t: any) => ({
            id: t.id,
            requirementId: r.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            isCompleted: t.isCompleted || false,
            effortPoints: t.effortPoints || 0,
            estimatedHours: t.estimatedHours || 0,
            assigneeId: t.assignee ? t.assignee.id : null,
            assignee: t.assignee,
            statusChangedAt: t.statusChangedAt
          }))
        }));
      } catch (reqErr) {
        console.warn('Failed to load requirements, falling back to project detail', reqErr);
        // Fallback: use requirements embedded in project detail
        const rawReqs = data.project.requirements || [];
        mappedReqs = rawReqs.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          color: r.color || '#6366F1',
          status: r.status || 'BACKLOG',
          storyPoints: r.storyPoints || 0,
          sprintId: r.sprint ? r.sprint.sprintId : null,
          tasks: (r.subtasks || r.tasks || []).map((t: any) => ({
            id: t.id,
            requirementId: r.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            isCompleted: t.isCompleted || false,
            effortPoints: t.effortPoints || 0,
            estimatedHours: t.estimatedHours || 0,
            assigneeId: t.assignee ? t.assignee.id : null,
            assignee: t.assignee,
            statusChangedAt: t.statusChangedAt
          }))
        }));
      }
      setAllProjectRequirements(mappedReqs);

      // Map members
      const mappedMembers: User[] = (data.members || []).map((m: any) => ({
        id: m.id,
        email: m.email,
        fullName: m.fullName || 'Unknown Member',
        role: m.role || 'MEMBER',
        capacityPoints: m.capacityPoints || 40
      }));
      setMembers(mappedMembers);

      // Map active sprint
      if (data.activeSprint) {
        const activeSprint = data.activeSprint;
        const tasks = data.activeSprintTasks || [];

        // Map subtasks
        const mappedSubtasks: Subtask[] = tasks.map((t: any) => ({
          id: t.id,
          requirementId: t.requirement ? t.requirement.id : 0,
          title: t.title,
          description: t.description || '',
          priority: t.priority || 'MEDIUM',
          status: t.status || 'TODO',
          isCompleted: t.isCompleted || false,
          effortPoints: t.effortPoints || 0,
          estimatedHours: t.estimatedHours || 0,
          assigneeId: t.assignee ? t.assignee.id : null,
          assignee: t.assignee,
          statusChangedAt: t.statusChangedAt
        }));

        // Requirements inside active sprint
        const sprintRequirements = mappedReqs.filter(r => r.sprintId === activeSprint.sprintId);

        // Fetch AI Insights
        let mappedInsights: AiInsight[] = [];
        try {
          const insightRes = await api.get<any[]>(`/ai/sprint/${activeSprint.sprintId}`);
          mappedInsights = insightRes.data.map(ins => ({
            id: ins.id,
            explanation: ins.explanation,
            confidenceScore: ins.confidenceScore,
            acknowledged: ins.acknowledged,
            insightType: ins.insightType,
            sprintHealthScore: ins.sprintHealthScore || 100,
            riskLevel: ins.riskLevel || 'LOW',
            bottlenecksJson: ins.bottlenecksJson,
            automatedStandupSummary: ins.automatedStandupSummary
          }));
        } catch (insErr) {
          console.warn('Failed to load AI Insights', insErr);
        }

        // Fetch Health Score
        let healthScore = 100;
        try {
          const metricsRes = await api.get<any>(`/projects/${projectId}/metrics`);
          // The backend metrics map includes "healthScore" or active sprint metrics
          healthScore = metricsRes.data.activeSprintHealthScore || metricsRes.data.healthScore || 100;
        } catch (healthErr) {
          console.warn('Failed to load health score from metrics', healthErr);
        }

        setSprint({
          id: activeSprint.sprintId,
          name: activeSprint.objective || `Sprint ${activeSprint.sprintId}`,
          objectives: activeSprint.objective || '',
          healthScore: healthScore,
          startDate: activeSprint.startDate,
          endDate: activeSprint.endDate,
          requirements: sprintRequirements,
          subtasks: mappedSubtasks,
          insights: mappedInsights,
          sprintStatus: activeSprint.sprintStatus
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
      setAllProjectRequirements([]);
      setMembers([]);
    }
  }, [loadProjectDetail]);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    const list = await loadProjects();
    const storedId = localStorage.getItem('levelup_current_project_id');
    if (storedId) {
      const activeProj = list.find(p => String(p.id) === storedId);
      if (activeProj) {
        setCurrentProjectState(activeProj);
        await loadProjectDetail(activeProj.id);
        return;
      }
    }
    setCurrentProjectState(null);
    setSprint(null);
  }, [isAuthenticated, loadProjects, loadProjectDetail]);

  useEffect(() => {
    refreshData();
  }, [isAuthenticated, refreshData]);

  const updateSubtaskStatus = async (subtaskId: number, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${subtaskId}/status`, { status: newStatus });
      if (currentProject) {
        await loadProjectDetail(currentProject.id);
      }
    } catch (err) {
      console.error('Failed to update subtask status', err);
      throw err;
    }
  };

  const addNewRequirement = async (title: string, description: string, color: string) => {
    if (!currentProject) return;
    try {
      await api.post(`/projects/${currentProject.id}/requirements`, {
        title,
        description,
        color
      });
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error('Failed to add requirement', err);
      throw err;
    }
  };

  const addNewSubtask = async (requirementId: number, title: string, storyPoints: number, assigneeId?: number | null) => {
    try {
      await api.post(`/requirements/${requirementId}/subtasks`, {
        title,
        description: `Subtask for requirement ${requirementId}`,
        priority: 'MEDIUM',
        status: 'TODO',
        effortPoints: storyPoints,
        estimatedHours: storyPoints * 4,
        assigneeId: assigneeId || null
      });
      if (currentProject) {
        await loadProjectDetail(currentProject.id);
      }
    } catch (err) {
      console.error('Failed to add subtask', err);
      throw err;
    }
  };

  const createNewSprint = async (
    objective: string,
    startDate: string,
    endDate: string,
    plannedStoryPoints: number,
    requirementIds: number[]
  ) => {
    if (!currentProject) return;
    try {
      await api.post(`/projects/${currentProject.id}/sprints`, {
        sprintObjective: objective,
        startDate,
        endDate,
        plannedStoryPoints,
        requirementIds,
        sprintStatus: 'ACTIVE'
      });
      await loadProjects(); // reload project lists
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error('Failed to create sprint', err);
      throw err;
    }
  };

  const completeSprint = async (sprintId: number) => {
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
      await loadProjects();
      setCurrentProject(newProj);
      return newProj;
    } catch (err) {
      console.error('Failed to create project', err);
      throw err;
    }
  };

  const inviteMember = async (email: string) => {
    if (!currentProject) return;
    try {
      await api.post(`/projects/${currentProject.id}/members`, { email });
      await loadProjectDetail(currentProject.id);
    } catch (err) {
      console.error('Failed to invite member', err);
      throw err;
    }
  };

  return (
    <SprintContext.Provider value={{
      projects,
      ownedProjects,
      memberProjects,
      currentProject,
      setCurrentProject,
      sprint,
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
      inviteMember
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
