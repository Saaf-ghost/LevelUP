# Product Backlog: Collaborative Project Management Platform

## Project Overview
A professional project management tool (Jira/Trello style) integrated with advanced performance analytics and AI-driven decision support.

---

## Epic 1: Project Setup & Core Architecture
**Objective:** Establish the technical foundation and security.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 1.1 | Initialize Spring Boot | Set up with Maven, Spring Web, Spring Data JPA, Spring Security, and dotenv. |
| 1.2 | Configure PostgreSQL | Establish DB connection via .env. Add docker-compose.yml for local DB. |
| 1.3 | Design Core JPA Entities | Create User, Project, Sprint, Task with proper relationships and Audit base. |
| 1.4 | JWT Authentication | Build /auth/register and /auth/login endpoints returning signed JWT tokens. |
| 1.5 | Role Model | Add Role enum (OWNER, MEMBER, VIEWER). Enforce at service layer. |
| 1.6 | Configure Spring Security | Wire JWT filter. Define public endpoints (/auth/**) and protected defaults. |

---

## Epic 2: The Agile Core (Jira MVP)
**Objective:** Develop fundamental CRUD operations, sprint lifecycle, and business rules.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 2.1 | Project CRUD | Only OWNER can delete. MEMBER can update. VIEWER is read-only. |
| 2.2 | Sprint Management | REST API for Sprints. Only one ACTIVE sprint allowed per project at a time. |
| 2.3 | Task State Machine | Implement rules: backlog tasks cannot skip directly to DONE. |
| 2.4 | Task Assignment | Before assigning, check if user's workload exceeds capacity (return warning). |
| 2.5 | Eager-load Project Data | Design detail endpoint to return active Sprint and Tasks in one response. |
| 2.6 | Decision Log | Add sub-resource to Task for short structured notes (what, why, decided-by). |

---

## Epic 3: The Metrics Engine
**Objective:** Business logic to calculate performance metrics and the Sprint Health Score.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 3.1 | Effort Points | Add effortPoints and estimatedHours; normalize to points for calculations. |
| 3.3 | Team Velocity | Calculate (completed points / planned points). Store per-sprint snapshots. |
| 3.4 | Workload Distribution | Return per-user workload. Flag users over 120% capacity. |
| 3.5 | Bottleneck Detection | Track time-in-column. Flag tasks exceeding threshold (e.g., 48h in REVIEW). |
| 3.6 | **Sprint Health Score** | **Composite 0-100 score**: Velocity (40%), Workload (30%), Timing (30%). |

---

## Epic 4: The Intelligence Module
**Objective:** Integrate Gemini API for context-aware, data-driven decision support.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 4.2 | Prompt Engineering | Build PromptBuilder to construct structured prompts from health/velocity data. |
| 4.3 | Risk Detection | If Health < 60, trigger alert with Gemini explanation of root cause. |
| 4.4 | Reassignment Assistant | AI suggests reassignments with rationale and estimated health impact. |
| 4.5 | Historical Pattern Analysis | Analyze last 5 sprints for patterns and actionable recommendations. |
| 4.7 | AI Insights Endpoints | Expose: /ai/sprint-risk, /ai/reassignment-suggestions, /ai/sprint-retrospective. |

---

## Epic 5: The Frictionless Frontend (React)
**Objective:** Build an intuitive, role-adaptive UI with clear visual performance insights.

| Task ID | Task Name | Description / Implementation Notes |
| :--- | :--- | :--- |
| 5.1 | Initialize React & Routing | Set up with Vite, Router v6, and Axios JWT interceptor. |
| 5.4 | Interactive Kanban | Drag-and-drop cards; color indicators for bottlenecks (>48h). |
| 5.5 | Health Score Widget | Display 0-100 score as a ring chart (Green 80+, Amber 50-79, Red <50). |
| 5.6 | **AI Insights Panel** | Show sprint risks, reassignment suggestions, and retrospective patterns. |
| 5.7 | Capacity Heatmap | Visual grid of team members vs. story points; highlight over-assigned members. |

---

## Recommended Build Order
1. **Phase 1:** Epic 1 - Full backend foundation with JWT auth and roles.
2. **Phase 2:** Epic 2 - Core CRUD + thin React Kanban shell in parallel for early demo.
3. **Phase 3:** Epic 3 - Metrics Engine + Health Score logic.
4. **Phase 4:** Epic 4 - AI Integration (Gemini prompts, parsing, and analysis).
5. **Phase 5:** Epic 5 - Complete frontend with AI panel, capacity heatmap, and role-based views.