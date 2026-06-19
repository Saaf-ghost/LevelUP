package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.TaskAssignmentDTO;
import com.ehtp.kanban_backend.dto.TaskAssignmentResponseDTO;
import com.ehtp.kanban_backend.dto.TaskRequestDTO;
import com.ehtp.kanban_backend.dto.TaskStatusUpdateDTO;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.model.TaskStatusHistory;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.SprintRepository;
import com.ehtp.kanban_backend.repository.TaskRepository;
import com.ehtp.kanban_backend.repository.TaskStatusHistoryRepository;
import com.ehtp.kanban_backend.repository.UserRepository;
import com.ehtp.kanban_backend.service.state.TaskState;
import com.ehtp.kanban_backend.service.state.TaskStateFactory;
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
    private final com.ehtp.kanban_backend.repository.RequirementRepository requirementRepository;
    private final WebhookDispatcherService webhookDispatcherService;

    public TaskService(
            TaskRepository taskRepository,
            SprintRepository sprintRepository,
            UserRepository userRepository,
            TaskStatusHistoryRepository taskStatusHistoryRepository,
            AuthorizationService authorizationService,
            com.ehtp.kanban_backend.repository.RequirementRepository requirementRepository,
            WebhookDispatcherService webhookDispatcherService
    ) {
        this.taskRepository = taskRepository;
        this.sprintRepository = sprintRepository;
        this.userRepository = userRepository;
        this.taskStatusHistoryRepository = taskStatusHistoryRepository;
        this.authorizationService = authorizationService;
        this.requirementRepository = requirementRepository;
        this.webhookDispatcherService = webhookDispatcherService;
    }

    public Task createTask(TaskRequestDTO dto) {
        Sprint sprint = getSprint(dto.getSprintId());
        User currentUser = authorizationService.currentUser();
        if (sprint.getProject().getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }
        
        Task task = new Task();
        applyEditableFields(task, dto, sprint);
        task.setStatus(dto.getStatus() == null ? Task.TaskStatus.TODO : dto.getStatus());
        task.setStatusChangedAt(LocalDateTime.now());
        Task saved = taskRepository.save(task);
        webhookDispatcherService.dispatchSprintMetrics(saved.getSprint());
        return saved;
    }

    public Task createSubtask(Long requirementId, TaskRequestDTO dto) {
        com.ehtp.kanban_backend.model.Requirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement not found"));
        
        User currentUser = authorizationService.currentUser();
        if (requirement.getProject().getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

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
        if (saved.getSprint() != null) {
            webhookDispatcherService.dispatchSprintMetrics(saved.getSprint());
        }
        return saved;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> getTasksBySprint(Long sprintId) {
        return taskRepository.findBySprintSprintId(sprintId);
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    public Task updateTask(Long id, TaskRequestDTO dto) {
        Task task = getTaskById(id);
        User currentUser = authorizationService.currentUser();
        if (task.getRequirement().getProject().getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

        Sprint sprint = getSprint(dto.getSprintId());
        applyEditableFields(task, dto, sprint);

        if (dto.getStatus() != null && dto.getStatus() != task.getStatus()) {
            changeStatus(task, dto.getStatus(), currentUser);
        }

        Task saved = taskRepository.save(task);
        webhookDispatcherService.dispatchSprintMetrics(saved.getSprint());
        return saved;
    }

    public Task updateStatus(Long id, TaskStatusUpdateDTO dto) {
        Task task = getTaskById(id);
        User changedBy = authorizationService.currentUser();
        // Allow members or owners to change status
        com.ehtp.kanban_backend.model.ProjectMembership.Role role = authorizationService.getProjectRole(task.getRequirement().getProject().getId());
        if (role == null) {
            throw new org.springframework.security.access.AccessDeniedException("User is not associated with this project");
        }

        changeStatus(task, dto.getStatus(), changedBy);
        Task saved = taskRepository.save(task);
        if (saved.getSprint() != null) {
            webhookDispatcherService.dispatchSprintMetrics(saved.getSprint());
        }
        return saved;
    }

    public TaskAssignmentResponseDTO assignTask(Long id, TaskAssignmentDTO dto) {
        Task task = getTaskById(id);
        authorizationService.requireProjectEditor(task.getRequirement().getProject().getId());
        if (dto.getAssigneeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assigneeId is required");
        }
        User assignee = userRepository.findById(dto.getAssigneeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        task.setAssignee(assignee);
        Task savedTask = taskRepository.save(task);
        if (savedTask.getSprint() != null) {
            webhookDispatcherService.dispatchSprintMetrics(savedTask.getSprint());
        }

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
        User currentUser = authorizationService.currentUser();
        if (task.getRequirement().getProject().getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }
        taskRepository.delete(task);
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
        com.ehtp.kanban_backend.model.Requirement requirement = requirementRepository.findById(dto.getRequirementId())
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
