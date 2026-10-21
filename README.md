# BoostUP

BoostUP is a focused agile delivery workspace for small teams. It brings projects, a user-story backlog, sprint planning, a real-time Kanban board, team roles, and lightweight delivery metrics into one application.

## Current scope
The project is building a production-ready core CRUD MVP:

- Projects and project membership
- User stories and backlog ordering
- Sprint planning and lifecycle
- Kanban task execution
- Team roles and capacity
- Burndown, velocity, and sprint progress

## Stack
| Layer | Technology |
| :--- | :--- |
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16 (H2 for tests) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Auth | JWT bearer tokens |
| Board interaction | dnd-kit |
| Charts | Recharts |

## Repository layout
```text
backend/
  src/main/java/com/boostup/
    controller/   REST controllers
    dto/          API request and response models
    model/        JPA entities
    repository/   Spring Data repositories
    security/     JWT and authorization rules
    service/      Domain services and metrics
  src/test/       Backend tests
frontend/
  src/components/ Shared UI and Kanban board
  src/context/    Auth and sprint state
  src/pages/      Landing, authentication, and workspace pages
docker-compose.yml
.env.example
```

## Architecture
BoostUP is a modular monolith. Controllers own HTTP concerns, services own domain rules and transactions, repositories own persistence, and DTOs define the API boundary. Authorization is enforced in the service and security layers rather than in the UI.

The core domain is intentionally independent of any external integration. New capabilities can be added as separate modules that consume the existing project, sprint, and task services without changing the core model.

## Local development
See [RUN_INSTRUCTIONS.md](RUN_INSTRUCTIONS.md) for setup, ports, and test commands.

Quick start:

```bash
cp .env.example .env
docker compose up -d
cd backend && ./mvnw spring-boot:run
# in a second terminal
cd frontend && npm install && npm run dev
```

## Configuration and secrets
- `.env` is local-only and ignored by Git.
- `.env.example` documents every supported variable with safe placeholders.
- Replace `JWT_SECRET` and database credentials before any shared or production deployment.

## Delivery plan
The phased backlog lives in [BACKLOG.md](BACKLOG.md). Phase 0 established the clean BoostUP baseline; the next phase focuses on project membership, roles, and the backlog model.
