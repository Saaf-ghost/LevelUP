package com.boostup.service;

import com.boostup.dto.TaskAssignmentDTO;
import com.boostup.dto.TaskAssignmentResponseDTO;
import com.boostup.dto.TaskRequestDTO;
import com.boostup.dto.TaskStatusUpdateDTO;
import com.boostup.model.Projet;
import com.boostup.model.Sprint;
import com.boostup.model.Task;
import com.boostup.model.TaskStatusHistory;
import com.boostup.model.User;
import com.boostup.repository.SprintRepository;
import com.boostup.repository.TaskRepository;
import com.boostup.repository.TaskStatusHistoryRepository;
import com.boostup.repository.UserRepository;
import com.boostup.service.state.TaskState;
import com.boostup.service.state.TaskStateFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final UserRepository userRepository;
    private final TaskStatusHistoryRepository taskStatusHistoryRepository;
    private final AuthorizationService authorizationService;
    private final com.boostup.repository.RequirementRepository requirementRepository;

    public TaskService(
            TaskRepository taskRepository,
            SprintRepository sprintRepository,
            UserRepository userRepository,
            TaskStatusHistoryRepository taskStatusHistoryRepository,
            AuthorizationService authorizationService,
            com.boostup.repository.RequirementRepository requirementRepository
    ) {
        this.taskRepository = taskRepository;
        this.sprintRepository = sprintRepository;
        this.userRepository = userRepository;
        this.taskStatusHistoryRepository = taskStatusHistoryRepository;
        this.authorizationService = authorizationService;
        this.requirementRepository = requirementRepository;
    }

    public Task createTask(TaskRequestDTO dto) {
        Sprint sprint = getSprint(dto.getSprintId());
        authorizationService.requireProjectEditor(sprint.getProject().getId());

        Task task = new Task();
        applyEditableFields(task, dto, sprint);
        task.setStatus(dto.getStatus() == null ? Task.TaskStatus.TODO : dto.getStatus());
        task.setStatusChangedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        return saved;
    }

    public Task createSubtask(Long requirementId, TaskRequestDTO dto) {
        com.boostup.model.Requirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement not found"));
        
        authorizationService.requireProjectEditor(requirement.getProject().getId());

        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription() == null ? "" : dto.getDescription());
        task.setPriority(dto.getPriority() == null ? Task.Priority.MEDIUM : dto.getPriority());
        task.setEffortPoints(dto.getEffortPoints() == null ? 0 : dto.getEffortPoints());
        task.setEstimatedHours(dto.getEstimatedHours() == null ? 0 : dto.getEstimatedHours());
        task.setStatus(dto.getStatus() == null ? Task.TaskStatus.TODO : dto.getStatus());
        task.setRequirement(requirement);
        
        if (requirement.getSprint() != null) {
            task.setSprint(requirement.getSprint());
        }

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            task.setAssignee(assignee);
        }

        task.setStatusChangedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        return saved;
    }

    public List<Task> getAllTasks() {
        User user = authorizationService.currentUser();
        List<Long> projectIds = authorizationService.accessibleProjectIds(user);
        if (projectIds.isEmpty()) {
            return List.of();
        }
        return taskRepository.findByRequirementProjectIdIn(projectIds);
    }

    public List<Task> getTasksBySprint(Long sprintId) {
        Sprint sprint = getSprint(sprintId);
        authorizationService.requireProjectViewer(sprint.getProject().getId());
        return taskRepository.findBySprintSprintId(sprintId);
    }

    public Task getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        authorizationService.requireProjectViewer(projectOf(task).getId());
        return task;
    }

    public Task updateTask(Long id, TaskRequestDTO dto) {
        Task task = getTaskById(id);
        User currentUser = authorizationService.currentUser();
        authorizationService.requireProjectEditor(projectOf(task).getId());

        Sprint sprint = getSprint(dto.getSprintId());
        applyEditableFields(task, dto, sprint);

        if (dto.getStatus() != null && dto.getStatus() != task.getStatus()) {
            changeStatus(task, dto.getStatus(), currentUser);
        }

        Task saved = taskRepository.save(task);
        return saved;
    }

    public Task updateStatus(Long id, TaskStatusUpdateDTO dto) {
        Task task = getTaskById(id);
        User changedBy = authorizationService.currentUser();
        // Owners and members both work the board; outsiders are rejected.
        authorizationService.requireProjectEditor(projectOf(task).getId());

        changeStatus(task, dto.getStatus(), changedBy);
        Task saved = taskRepository.save(task);
        return saved;
    }

    public TaskAssignmentResponseDTO assignTask(Long id, TaskAssignmentDTO dto) {
        Task task = getTaskById(id);
        authorizationService.requireProjectEditor(projectOf(task).getId());
        if (dto.getAssigneeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assigneeId is required");
        }
        User assignee = userRepository.findById(dto.getAssigneeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        task.setAssignee(assignee);
        Task savedTask = taskRepository.save(task);

        int workload = savedTask.getSprint() == null ? 0 : calculateWorkload(savedTask.getSprint(), assignee.getId());
        int capacity = assignee.getCapacityPoints() == null ? 0 : assignee.getCapacityPoints();
        boolean overAssigned = capacity > 0 && workload > capacity;
        String warning = overAssigned
                ? "Warning: assignee workload is " + workload + " points, above capacity of " + capacity + " points."
                : null;

        return new TaskAssignmentResponseDTO(savedTask, overAssigned, workload, capacity, warning);
    }

    public void deleteTask(Long id) {
        Task task = getTaskById(id);
        authorizationService.requireProjectEditor(projectOf(task).getId());
        taskRepository.delete(task);
    }

    private Projet projectOf(Task task) {
        Projet project = task.getRequirement() == null ? null : task.getRequirement().getProject();
        if (project == null && task.getSprint() != null) {
            project = task.getSprint().getProject();
        }
        if (project == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Task is not attached to a project");
        }
        return project;
    }

    private void applyEditableFields(Task task, TaskRequestDTO dto, Sprint sprint) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription() == null ? "" : dto.getDescription());
        task.setPriority(dto.getPriority() == null ? Task.Priority.MEDIUM : dto.getPriority());
        task.setEffortPoints(dto.getEffortPoints() == null ? 0 : Math.max(0, dto.getEffortPoints()));
        task.setEstimatedHours(dto.getEstimatedHours() == null ? 0 : Math.max(0, dto.getEstimatedHours()));
        task.setSprint(sprint);

        if (dto.getRequirementId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requirementId is required");
        }
        com.boostup.model.Requirement requirement = requirementRepository.findById(dto.getRequirementId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement not found"));
        task.setRequirement(requirement);

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }
    }

    private void changeStatus(Task task, Task.TaskStatus to, User changedBy) {
        if (to == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target status is required");
        }
        Task.TaskStatus from = task.getStatus();
        if (from == to) {
            return;
        }

        TaskState state = TaskStateFactory.getState(from);
        state.transitionTo(task, to);

        LocalDateTime changedAt = LocalDateTime.now();
        task.setStatus(to);
        task.setStatusChangedAt(changedAt);

        TaskStatusHistory history = new TaskStatusHistory();
        history.setTask(task);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedAt(changedAt);
        history.setChangedBy(changedBy);
        taskStatusHistoryRepository.save(history);
    }

    private int calculateWorkload(Sprint sprint, Long assigneeId) {
        return taskRepository.findBySprintAndAssigneeIdAndStatusNot(sprint, assigneeId, Task.TaskStatus.DONE)
                .stream()
                .map(Task::getEffortPoints)
                .mapToInt(points -> points == null ? 0 : points)
                .sum();
    }

    private Sprint getSprint(Long sprintId) {
        if (sprintId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sprintId is required");
        }
        return sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));
    }
}
