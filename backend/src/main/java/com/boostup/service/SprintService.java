package com.boostup.service;

import com.boostup.dto.SprintRequestDTO;
import com.boostup.model.Projet;
import com.boostup.model.Requirement;
import com.boostup.model.Sprint;
import com.boostup.model.Task;
import com.boostup.model.User;
import com.boostup.repository.ProjetRepository;
import com.boostup.repository.RequirementRepository;
import com.boostup.repository.SprintRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjetRepository projetRepository;
    private final RequirementRepository requirementRepository;
    private final AuthorizationService authorizationService;

    public SprintService(
            SprintRepository sprintRepository,
            ProjetRepository projetRepository,
            RequirementRepository requirementRepository,
            AuthorizationService authorizationService
    ) {
        this.sprintRepository = sprintRepository;
        this.projetRepository = projetRepository;
        this.requirementRepository = requirementRepository;
        this.authorizationService = authorizationService;
    }

    public Sprint createSprintForProject(Long projectId, SprintRequestDTO dto) {
        dto.setProjectId(projectId);
        return createSprint(dto);
    }

    public Sprint createSprint(SprintRequestDTO dto) {
        validateSprintRequest(dto);
        Projet project = projetRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        authorizationService.requireProjectOwner(project.getId());

        // Before executing sprint insertion, query for active sprints
        sprintRepository.findByProjectIdAndIsActive(dto.getProjectId(), true)
                .ifPresent(activeSprint -> {
                    throw new com.boostup.exception.ActiveSprintExistsException("This project already has an active sprint");
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

        return saved;
    }

    public List<Sprint> getAllSprints() {
        User user = authorizationService.currentUser();
        List<Long> projectIds = authorizationService.accessibleProjectIds(user);
        if (projectIds.isEmpty()) {
            return List.of();
        }
        return sprintRepository.findByProjectIdIn(projectIds);
    }

    public List<Sprint> getSprintsByProject(Long projectId) {
        authorizationService.requireProjectViewer(projectId);
        return sprintRepository.findByProjectId(projectId);
    }

    public Sprint getSprintById(Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));
        authorizationService.requireProjectViewer(sprint.getProject().getId());
        return sprint;
    }

    public Sprint updateSprint(Long id, SprintRequestDTO dto) {
        validateSprintRequest(dto);
        Sprint sprint = getSprintById(id);
        Projet project = sprint.getProject();

        authorizationService.requireProjectOwner(project.getId());

        // If transitioning to ACTIVE or is active
        if (dto.getSprintStatus() == Sprint.SprintStatus.ACTIVE) {
            sprintRepository.findByProjectIdAndIsActive(project.getId(), true)
                    .ifPresent(activeSprint -> {
                        if (activeSprint.getSprintId() != id) {
                            throw new com.boostup.exception.ActiveSprintExistsException("This project already has an active sprint");
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

        return saved;
    }

    public void deleteSprint(Long id) {
        Sprint sprint = getSprintById(id);
        authorizationService.requireProjectOwner(sprint.getProject().getId());
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
        return sprintRepository.save(sprint);
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
