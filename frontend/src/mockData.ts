// ============================================================
// Mock Data — Hierarchical Sprint Model
// ============================================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

/** Column display labels */
export const COLUMN_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

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
  color: string;          // stripe colour for child cards
  /** Computed dynamically — do NOT set manually */
  status: TaskStatus;
  storyPoints: number;
}

export interface Subtask {
  id: string;
  requirementId: string;
  title: string;
  status: TaskStatus;
  assigneeId?: string;    // FK to TeamMember.id
  storyPoints: number;
  timeInColumn: number;   // hours
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
  startDate: string;      // ISO 8601
  endDate: string;        // ISO 8601
  requirements: Requirement[];
  subtasks: Subtask[];
  insights: AiInsight[];
}

// ===== Team Members =====
export const teamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Alex Rivera',  avatar: 'https://i.pravatar.cc/150?u=alex',   skills: ['Frontend', 'UI/UX Designer'] },
  { id: 'tm-2', name: 'Sam Chen',     avatar: 'https://i.pravatar.cc/150?u=sam',    skills: ['Backend', 'DevOps'] },
  { id: 'tm-3', name: 'Jordan Lee',   avatar: 'https://i.pravatar.cc/150?u=jordan', skills: ['QA', 'Frontend'] },
  { id: 'tm-4', name: 'Casey Park',   avatar: 'https://i.pravatar.cc/150?u=casey',  skills: ['Backend', 'QA'] },
];

// ===== Requirements =====
export const mockRequirements: Requirement[] = [
  { id: 'req-1', title: 'Authentication Overhaul',  description: 'Implement mock JWT backend and elaborated registration flow.',       color: '#3b82f6', status: 'IN_PROGRESS', storyPoints: 0 },
  { id: 'req-2', title: 'Kanban Visual Upgrade',    description: 'Parent‑linking stripes, dense professional layout, countdown timer.', color: '#10b981', status: 'TODO',        storyPoints: 0 },
  { id: 'req-3', title: 'Metrics Engine Core',      description: 'Sprint health score, velocity tracker, workload distribution.',      color: '#f59e0b', status: 'TODO',        storyPoints: 0 },
];

// ===== Subtasks =====
const rawSubtasks: Subtask[] = [
  { id: 'st-1', requirementId: 'req-1', title: 'Build mockBackend service',        status: 'DONE',        assigneeId: 'tm-1', storyPoints: 3,  timeInColumn: 12 },
  { id: 'st-2', requirementId: 'req-1', title: 'Elaborated registration form',     status: 'IN_PROGRESS', assigneeId: 'tm-2', storyPoints: 5,  timeInColumn: 52 },
  { id: 'st-3', requirementId: 'req-2', title: 'Implement visual stripe on cards', status: 'IN_PROGRESS', assigneeId: 'tm-3', storyPoints: 8,  timeInColumn: 24 },
  { id: 'st-4', requirementId: 'req-3', title: 'Sprint countdown timer widget',    status: 'DONE',        assigneeId: 'tm-1', storyPoints: 5,  timeInColumn: 4  },
  { id: 'st-5', requirementId: 'req-3', title: 'Calculate requirement story pts',  status: 'TODO',        assigneeId: 'tm-2', storyPoints: 13, timeInColumn: 0  },
  { id: 'st-6', requirementId: 'req-2', title: 'Create Sprint modal UI',           status: 'TODO',                            storyPoints: 8,  timeInColumn: 0  },
  { id: 'st-7', requirementId: 'req-3', title: 'Intelligent assignment logic',     status: 'IN_PROGRESS', assigneeId: 'tm-4', storyPoints: 5,  timeInColumn: 30 },
  { id: 'st-8', requirementId: 'req-1', title: 'Profile settings expansion',       status: 'TODO',        assigneeId: 'tm-3', storyPoints: 3,  timeInColumn: 0  },
];

// ===== Sprint =====
const today = new Date();
const sprintStart = new Date(today);
sprintStart.setDate(today.getDate() - 11);    // started 11 days ago
const sprintEnd = new Date(sprintStart);
sprintEnd.setDate(sprintStart.getDate() + 14); // 14-day sprint

export const mockSprint: SprintData = {
  id: 'sprint-42',
  name: 'Sprint 42 — UI Overhaul',
  objectives: 'Complete authentication, Kanban visual upgrades, and metrics engine core.',
  healthScore: 72,
  startDate: sprintStart.toISOString(),
  endDate: sprintEnd.toISOString(),
  requirements: mockRequirements,
  subtasks: rawSubtasks,
  insights: [
    {
      id: 'insight-1',
      type: 'RISK_WARNING',
      title: 'Sprint Risk Warning',
      description: '"Elaborated registration form" has been stuck in REVIEW for over 48 hours.',
      rationale: 'Prolonged review times reduce overall velocity and block dependent subtasks.',
    },
    {
      id: 'insight-2',
      type: 'REASSIGNMENT_SUGGESTION',
      title: 'Reassignment Suggestion',
      description: 'Consider reassigning "Intelligent assignment logic" from Sam Chen.',
      rationale: 'Sam Chen is at 130% capacity. Reassigning to Alex Rivera would balance workload and improve Sprint Health by an estimated +8 points.',
      suggestedAction: 'Reassign to Alex Rivera',
      impact: '+8 Health Score',
    },
  ],
};

// ===== Computed metrics =====
/** Recalculate requirement status + storyPoints from linked subtasks */
export function recalcRequirements(sprint: SprintData): void {
  for (const req of sprint.requirements) {
    const linked = sprint.subtasks.filter(s => s.requirementId === req.id);
    req.storyPoints = linked.reduce((sum, s) => sum + s.storyPoints, 0);

    if (linked.length === 0) continue;
    if (linked.every(s => s.status === 'DONE'))            req.status = 'DONE';
    else if (linked.some(s => s.status === 'IN_PROGRESS')) req.status = 'IN_PROGRESS';
    else                                                   req.status = 'TODO';
  }
}

recalcRequirements(mockSprint);

// ===== Helpers =====
export function getTeamMember(id?: string): TeamMember | undefined {
  return teamMembers.find(m => m.id === id);
}
