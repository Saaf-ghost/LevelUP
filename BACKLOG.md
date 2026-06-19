# Product Backlog: Collaborative Project Management Platform

## Project Overview
A professional project management tool (Jira/Trello style) integrated with advanced performance analytics, AI-driven decision support, and automated n8n agent auditing.

---

## Epic 1: Project Setup & Core Architecture
**Objective:** Establish the technical foundation, database schemas, and security.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 1.1 | Initialize Spring Boot | Set up with Maven, Spring Web, Spring Data JPA, Spring Security, and dotenv. |
| 1.2 | Configure PostgreSQL | Establish DB connection via .env. Add docker-compose.yml for local DB. |
| 1.3 | Design Hierarchical Entities | Create User, Project, Sprint, Requirement, and Subtask (Task) with proper JPA mappings and JsonIgnore properties to prevent circular reference serialization. |
| 1.4 | JWT Authentication | Build /auth/register and /auth/login endpoints returning signed JWT tokens. |
| 1.5 | Role Model | Add Role enum (OWNER, MEMBER, VIEWER). Enforce at service layer. |
| 1.6 | Configure Spring Security | Wire JWT filter. Define public endpoints (/auth/**) and protected defaults. |

---

## Epic 2: The Agile Backlog & Kanban Core (Jira MVP)
**Objective:** Develop CRUD operations, sprint lifecycle, requirement backlog tree, and kanban board subtask tracking.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 2.1 | Project & Requirement CRUD | Only OWNER can delete. MEMBER can update. Requirement backlog allows planning scope before sprint binding. |
| 2.2 | Sprint Management | REST API for Sprints. Only one ACTIVE sprint allowed per project. Support Transactional completion with subtask completion validations. |
| 2.3 | Kanban Board | Subtasks tracked via status columns (TODO, IN_PROGRESS, DONE). Implement Drag-and-drop subtask transitions with persistent backend saving. |
| 2.4 | Inline Subtask Creation | Allow creating and assigning subtasks (with story points) directly inside requirements in the backlog tab. |
| 2.5 | Eager-load Workspace Data | Design detail endpoint to return active Sprint, Requirements, and Subtasks in one optimized payload. |

---

## Epic 3: The Metrics Engine
**Objective:** Business logic to calculate performance metrics, capacity utilization, and Sprint Health Score.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 3.1 | Subtask Story Points | Add effortPoints and estimatedHours to Subtasks; aggregate story points up to Requirements. |
| 3.2 | Team Velocity | Calculate (completed points / planned points) for concluded sprints. Store snapshots. |
| 3.3 | Capacity Utilization | Track per-user workload compared to capacity limit (SP). Flag overloaded team members in UI. |
| 3.4 | Sprint Health Score | Composite 0-100 score: Velocity (40%), Workload (30%), Timing (30%) calculated on active subtasks. |

---

## Epic 4: The Intelligence & Automation Module
**Objective:** Integrate Gemini API for context-aware decision support and n8n workflows for automated standup auditing.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 4.1 | Prompt Engineering | Construct structured prompts from sprint metrics, health score, and workload distribution. |
| 4.2 | Gemini AI Risk Assessment | Analyze active sprint data to trigger alerts with explanations of bottlenecks and reassignment suggestions. |
| 4.3 | n8n Agent Standup Sync | Automated standup pipeline running via n8n nodes (e.g. `sprint-{id}`). Generates automated progress logs, velocity syncs, and slack standup posts. |
| 4.4 | AI Insights Endpoints | Expose: /api/sprints/{id}/insights returning risk assessments, standup summaries, and AI recommendations. |

---

## Epic 5: The Frictionless Frontend (React)
**Objective:** Build an intuitive, role-adaptive UI with clear visual performance insights, backlog trees, and team workloads.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 5.1 | Initialize React & Router | Set up with Vite, Tailwind CSS / Vanilla CSS, Router v6, and Axios interceptors. |
| 5.2 | Requirement Backlog Tree | Visual tree nested list of Requirements; toggle expansion to view underlying Subtasks and inline "+ Subtask" form. |
| 5.3 | Responsive Kanban Board | Interactive dnd-kit column grid taking full center space. Supports subtask transition persistence across tab navigation. |
| 5.4 | Team Workload Accordions | Interactive accordion list in Team tab. Expands to display capacity progress bars, workload stats, and subtask lists. |
| 5.5 | Health & Metrics Widgets | Ring charts for Sprint Health Score, and distribution charts showing Story Points by Kanban column. |

---

## Recommended Build Order
1. **Phase 1 (Core Setup):** Epic 1 - Full backend foundation with JWT auth, PostgreSQL, and hierarchical JPA schemas (Requirements and Subtasks).
2. **Phase 2 (Agile Workflows):** Epic 2 - Backlog management, inline subtask mapping, and responsive Kanban Board.
3. **Phase 3 (Metrics & Analytics):** Epic 3 - Metrics engine, team velocity tracker, and Sprint Health Score calculations.
4. **Phase 4 (AI & n8n Automation):** Epic 4 - Gemini AI insights engine and n8n workflows for automated standup auditing.
5. **Phase 5 (Premium UI Polishing):** Epic 5 - Backlog trees, team capacity accordions, metrics widgets, and role-based permissions.