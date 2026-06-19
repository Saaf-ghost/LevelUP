package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.SprintRequestDTO;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.Requirement;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import com.ehtp.kanban_backend.repository.RequirementRepository;
import com.ehtp.kanban_backend.repository.SprintRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjetRepository projetRepository;
    private final RequirementRepository requirementRepository;
    private final AuthorizationService authorizationService;
    private final WebhookDispatcherService webhookDispatcherService;

    public SprintService(
            SprintRepository sprintRepository,
            ProjetRepository projetRepository,
            RequirementRepository requirementRepository,
            AuthorizationService authorizationService,
            WebhookDispatcherService webhookDispatcherService
    ) {
        this.sprintRepository = sprintRepository;
        this.projetRepository = projetRepository;
        this.requirementRepository = requirementRepository;
        this.authorizationService = authorizationService;
        this.webhookDispatcherService = webhookDispatcherService;
    }

    public Sprint createSprintForProject(Long projectId, SprintRequestDTO dto) {
        dto.setProjectId(projectId);
        return createSprint(dto);
    }

    public Sprint createSprint(SprintRequestDTO dto) {
        validateSprintRequest(dto);
        Projet project = projetRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        // Assert ownership: project owner matches the current executing user
        User currentUser = authorizationService.currentUser();
        if (project.getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

        // Before executing sprint insertion, query for active sprints
        sprintRepository.findByProjectIdAndIsActive(dto.getProjectId(), true)
                .ifPresent(activeSprint -> {
                    throw new com.ehtp.kanban_backend.exception.ActiveSprintExistsException("This project already has an active sprint");
                });

        Sprint sprint = new Sprint();
        sprint.setObjective(dto.getObjective());
        sprint.setStartDate(dto.getStartDate());
        sprint.setEndDate(dto.getEndDate());
        sprint.setPointsPlanned(dto.getPointsPlanned());
        sprint.setProject(project);
        sprint.setSprintStatus(dto.getSprintStatus() == null ? Sprint.SprintStatus.PLANNED : dto.getSprintStatus());

        Sprint saved = sprintRepository.save(sprint);

        // Process requirements if specified
        if (dto.getRequirementIds() != null && !dto.getRequirementIds().isEmpty()) {
            for (Long reqId : dto.getRequirementIds()) {
                Requirement req = requirementRepository.findById(reqId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement " + reqId + " not found"));
                if (req.getProject().getId() != project.getId()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement " + reqId + " does not belong to this project");
                }
                req.setSprint(saved);
                if (saved.getIsActive()) {
                    req.setStatus(Requirement.RequirementStatus.TODO);
                    if (req.getSubtasks() != null) {
                        for (Task task : req.getSubtasks()) {
                            task.setSprint(saved);
                            task.setStatus(Task.TaskStatus.TODO);
                        }
                    }
                }
                requirementRepository.save(req);
            }
        }

        webhookDispatcherService.dispatchSprintMetrics(saved);
        return saved;
    }

    public List<Sprint> getAllSprints() {
        return sprintRepository.findAll();
    }

    public List<Sprint> getSprintsByProject(Long projectId) {
        return sprintRepository.findByProjectId(projectId);
    }

    public Sprint getSprintById(Long id) {
        return sprintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));
    }

    public Sprint updateSprint(Long id, SprintRequestDTO dto) {
        validateSprintRequest(dto);
        Sprint sprint = getSprintById(id);
        Projet project = sprint.getProject();

        User currentUser = authorizationService.currentUser();
        if (project.getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

        // If transitioning to ACTIVE or is active
        if (dto.getSprintStatus() == Sprint.SprintStatus.ACTIVE) {
            sprintRepository.findByProjectIdAndIsActive(project.getId(), true)
                    .ifPresent(activeSprint -> {
                        if (activeSprint.getSprintId() != id) {
                            throw new com.ehtp.kanban_backend.exception.ActiveSprintExistsException("This project already has an active sprint");
                        }
                    });
        }

        sprint.setObjective(dto.getObjective());
        sprint.setStartDate(dto.getStartDate());
        sprint.setEndDate(dto.getEndDate());
        sprint.setPointsPlanned(dto.getPointsPlanned());
        sprint.setSprintStatus(dto.getSprintStatus() == null ? Sprint.SprintStatus.PLANNED : dto.getSprintStatus());

        Sprint saved = sprintRepository.save(sprint);

        // Process requirements if specified
        if (dto.getRequirementIds() != null && !dto.getRequirementIds().isEmpty()) {
            for (Long reqId : dto.getRequirementIds()) {
                Requirement req = requirementRepository.findById(reqId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement " + reqId + " not found"));
                if (req.getProject().getId() != project.getId()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requirement " + reqId + " does not belong to this project");
                }
                req.setSprint(saved);
                if (saved.getIsActive()) {
                    req.setStatus(Requirement.RequirementStatus.TODO);
                    if (req.getSubtasks() != null) {
                        for (Task task : req.getSubtasks()) {
                            task.setSprint(saved);
                            task.setStatus(Task.TaskStatus.TODO);
                        }
                    }
                }
                requirementRepository.save(req);
            }
        }

        webhookDispatcherService.dispatchSprintMetrics(saved);
        return saved;
    }

    public void deleteSprint(Long id) {
        authorizationService.requireOwner();
        Sprint sprint = getSprintById(id);
        sprintRepository.delete(sprint);
    }

    public Sprint completeSprint(Long id) {
        Sprint sprint = getSprintById(id);
        authorizationService.requireProjectEditor(sprint.getProject());

        boolean allDone = sprint.getTasks().stream()
                .allMatch(task -> task.getStatus() == Task.TaskStatus.DONE);

        if (!allDone) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot complete sprint: all subtasks must be DONE");
        }

        sprint.setSprintStatus(Sprint.SprintStatus.DONE);
        Sprint saved = sprintRepository.save(sprint);
        webhookDispatcherService.dispatchSprintMetrics(saved);
        return saved;
    }

    private void validateSprintRequest(SprintRequestDTO dto) {
        if (dto.getProjectId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "projectId is required");
        }
        if (dto.getStartDate() == null || dto.getEndDate() == null || !dto.getStartDate().isBefore(dto.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate must be before endDate");
        }
        if (dto.getPointsPlanned() == null || dto.getPointsPlanned() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pointsPlanned must be greater than or equal to 0");
        }
        if (dto.getSprintStatus() == null) {
            dto.setSprintStatus(Sprint.SprintStatus.PLANNED);
        }
    }
}
