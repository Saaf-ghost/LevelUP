# LevelUP Database Verification Guide

This guide provides a comprehensive overview of the PostgreSQL database schema for the LevelUP Agile/Scrum project management workspace, along with instructions and query templates for inspecting the data directly inside the PostgreSQL Docker container.

---

## 🔑 Database Connection Reference

The PostgreSQL database runs in a Docker container named `levelup-postgres`. It is accessible via the following parameters:

*   **Host Port (mapped):** `55432`
*   **Container Port (internal):** `5432`
*   **Database Name:** `levelup`
*   **Database User:** `levelup`
*   **Database Password:** `levelup`

---

## 🛠️ How to Access the Database via `psql`

You can inspect the database tables by executing query commands directly or by launching an interactive terminal shell session inside the container.

### Option A: Open an Interactive `psql` Terminal
Run this command in your host terminal to open the interactive SQL shell:
```bash
docker exec -it levelup-postgres psql -U levelup -d levelup
```
*To exit the shell, type `\q` and press Enter.*

### Option B: Run a One-off SQL Query
You can run any SQL query from your host command line by appending `-c "YOUR QUERY"`:
```bash
docker exec levelup-postgres psql -U levelup -d levelup -c "SELECT * FROM users;"
```

---

## 📊 Database Tables & Column Specifications

Below are the active database tables managed by the Java Spring Boot application, followed by deprecated legacy tables.

### 1. `users` (Active)
Stores user accounts, capacity constraints, and roles.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`email`** (`character varying(255)`, `NOT NULL`, Unique)
*   **`full_name`** (`character varying(255)`, `NOT NULL`)
*   **`password_hash`** (`character varying(255)`, `NOT NULL`)
*   **`role`** (`character varying(255)`, `NOT NULL`) — values: `OWNER`, `MEMBER`, `VIEWER`
*   **`capacity_points`** (`integer`, `NOT NULL`, Default: `40`)
*   **`skills`** (`text`, `NULL`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 2. `projects` (Active)
Represents a project workspace owned by a user.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`name`** (`character varying(255)`, `NOT NULL`)
*   **`description`** (`text`, `NOT NULL`)
*   **`start_date`** (`date`, `NOT NULL`)
*   **`end_date`** (`date`, `NOT NULL`)
*   **`status`** (`character varying(255)`, `NOT NULL`) — values: `PLANNED`, `IN_PROGRESS`, `DONE`
*   **`owner_id`** (`bigint`, `NOT NULL`, Foreign Key to `users.id`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 3. `project_members` (Active)
A join table created automatically by Hibernate for the `@ManyToMany` relationship between `projects` and `users`.
*   **`project_id`** (`bigint`, `NOT NULL`, Foreign Key to `projects.id`)
*   **`user_id`** (`bigint`, `NOT NULL`, Foreign Key to `users.id`)

### 4. `project_memberships` (Active)
Explicit mapping table for assigning user roles inside projects.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`project_id`** (`bigint`, `NOT NULL`, Foreign Key to `projects.id`)
*   **`user_id`** (`bigint`, `NOT NULL`, Foreign Key to `users.id`)
*   **`role`** (`character varying(255)`, `NOT NULL`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 5. `sprints` (Active)
Sprints containing goals and timeline details.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`objective`** (`text`, `NOT NULL`)
*   **`start_date`** (`date`, `NOT NULL`)
*   **`end_date`** (`date`, `NOT NULL`)
*   **`planned_points`** (`integer`, `NOT NULL`, Default: `0`)
*   **`is_active`** (`boolean`, `NOT NULL`, Default: `false`)
*   **`is_concluded`** (`boolean`, `NOT NULL`, Default: `false`)
*   **`sprint_status`** (`character varying(255)`, `NOT NULL`) — values: `PLANNED`, `ACTIVE`, `DONE`
*   **`project_id`** (`bigint`, `NOT NULL`, Foreign Key to `projects.id`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 6. `requirements` (Active)
High-level Epics or User Stories that group subtasks/tasks.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`title`** (`character varying(255)`, `NOT NULL`)
*   **`description`** (`text`, `NOT NULL`)
*   **`status`** (`character varying(255)`, `NOT NULL`)
*   **`color`** (`character varying(255)`, `NULL`)
*   **`story_points`** (`integer`, `NULL`)
*   **`sprint_id`** (`bigint`, `NOT NULL`, Foreign Key to `sprints.id`)
*   **`project_id`** (`bigint`, `NOT NULL`, Foreign Key to `projects.id`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 7. `subtasks` (Active)
Agile development tasks that developers work on.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`title`** (`character varying(255)`, `NOT NULL`)
*   **`description`** (`character varying(2000)`, `NOT NULL`)
*   **`priority`** (`character varying(255)`, `NOT NULL`) — values: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
*   **`status`** (`character varying(255)`, `NOT NULL`) — values: `TODO`, `IN_PROGRESS`, `DONE`
*   **`is_completed`** (`boolean`, `NOT NULL`)
*   **`effort_points`** (`integer`, `NOT NULL`)
*   **`estimated_hours`** (`integer`, `NOT NULL`)
*   **`status_changed_at`** (`timestamp(6) without time zone`, `NOT NULL`)
*   **`assigned_user_id`** (`bigint`, `NULL`, Foreign Key to `users.id`)
*   **`member_id`** (`bigint`, `NULL`, Foreign Key to `users.id`)
*   **`requirement_id`** (`bigint`, `NOT NULL`, Foreign Key to `requirements.id`)
*   **`sprint_id`** (`bigint`, `NOT NULL`, Foreign Key to `sprints.id`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 8. `task_status_history` (Active)
Audit log tracking task transitions.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`task_id`** (`bigint`, `NOT NULL`, Foreign Key to `subtasks.id`)
*   **`changed_by_user_id`** (`bigint`, `NULL`, Foreign Key to `users.id`)
*   **`from_status`** (`character varying(255)`, `NULL`)
*   **`to_status`** (`character varying(255)`, `NOT NULL`)
*   **`changed_at`** (`timestamp(6) without time zone`, `NOT NULL`)

### 9. `decision_note` (Active)
Architectural and design logs attached to individual tasks.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`what`** (`character varying(2000)`, `NOT NULL`)
*   **`why`** (`character varying(2000)`, `NOT NULL`)
*   **`task_id`** (`bigint`, `NOT NULL`, Foreign Key to `subtasks.id`)
*   **`user_id`** (`bigint`, `NOT NULL`, Foreign Key to `users.id`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 10. `ai_insights` (Active)
Sprint health assessment, Standup summaries, and risk tracking fetched from the LLM or n8n workflow.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`explanation`** (`character varying(4000)`, `NULL`)
*   **`automated_standup_summary`** (`text`, `NULL`)
*   **`bottlenecks_json`** (`text`, `NULL`)
*   **`confidence_score`** (`integer`, `NULL`)
*   **`insight_type`** (`character varying`, `NULL`)
*   **`risk_level`** (`character varying`, `NULL`)
*   **`sprint_health_score`** (`integer`, `NULL`)
*   **`acknowledged`** (`boolean`, `NULL`)
*   **`project_id`** (`bigint`, `NULL`, Foreign Key to `projects.id`)
*   **`sprint_id`** (`bigint`, `NULL`, Foreign Key to `sprints.id`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

### 11. `sprint_metric_snapshot` (Active)
Time-series measurements tracking velocity and health indicators.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`sprint_id`** (`bigint`, `NOT NULL`)
*   **`planned_points`** (`integer`, `NOT NULL`)
*   **`completed_points`** (`integer`, `NOT NULL`)
*   **`velocity_ratio`** (`double precision`, `NOT NULL`)
*   **`health_score`** (`integer`, `NOT NULL`)
*   **`created_at`** (`timestamp(6) without time zone`, `NOT NULL`)

### 12. `boards` (Active)
Represents structural board configuration settings.
*   **`id`** (`bigint`, `NOT NULL`, Primary Key)
*   **`name`** (`character varying`, `NULL`)
*   **`description`** (`character varying`, `NULL`)
*   **`created_at`** (`timestamp(6) without time zone`, `NULL`)
*   **`updated_at`** (`timestamp(6) without time zone`, `NULL`)

---

### ⚠️ Deprecated Legacy Tables (Do Not Use)
These tables were created under different names in older database schemas and are no longer mapped by Java Spring Boot entities.
*   `projet` (superceded by `projects`)
*   `sprint` (superceded by `sprints`)
*   `ai_insight` (superceded by `ai_insights`)

---

## 🔍 Useful SQL Inspection Snippets

Run these query templates inside the container to quickly inspect LevelUP database records:

### 1. View User Accounts & Roles
```sql
SELECT id, email, full_name, role, capacity_points FROM users;
```

### 2. View Active Projects and Owners
```sql
SELECT p.id, p.name, p.status, u.email AS owner_email 
FROM projects p 
JOIN users u ON p.owner_id = u.id;
```

### 3. Check All Active Sprints
```sql
SELECT id, objective, start_date, end_date, sprint_status, is_active 
FROM sprints 
WHERE is_active = true;
```

### 4. Count Tasks by Column Status
```sql
SELECT status, COUNT(*) AS task_count 
FROM subtasks 
GROUP BY status;
```

### 5. Inspect Backlog Requirements for a Specific Project
```sql
SELECT id, title, status, story_points 
FROM requirements 
WHERE project_id = 1;
```
