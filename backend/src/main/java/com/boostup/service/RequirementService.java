package com.boostup.service;

import com.boostup.dto.RequirementRequestDTO;
import com.boostup.model.Projet;
import com.boostup.model.Requirement;
import com.boostup.model.Sprint;
import com.boostup.model.User;
import com.boostup.repository.ProjetRepository;
import com.boostup.repository.RequirementRepository;
import com.boostup.repository.SprintRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class RequirementService {
    private final RequirementRepository requirementRepository;
    private final SprintRepository sprintRepository;
    private final ProjetRepository projetRepository;
    private final AuthorizationService authorizationService;

    public RequirementService(
            RequirementRepository requirementRepository,
            SprintRepository sprintRepository,
            ProjetRepository projetRepository,
            AuthorizationService authorizationService
    ) {
        this.requirementRepository = requirementRepository;
        this.sprintRepository = sprintRepository;
        this.projetRepository = projetRepository;
        this.authorizationService = authorizationService;
    }

    public Requirement createRequirement(RequirementRequestDTO dto) {
        if (dto.getSprintId() != null) {
            Sprint sprint = sprintRepository.findById(dto.getSprintId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));

            authorizationService.requireProjectOwner(sprint.getProject().getId());

            if (sprint.getIsActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot inject requirement directly into an active sprint.");
            }

            Requirement requirement = new Requirement();
            requirement.setTitle(dto.getTitle());
            requirement.setDescription(dto.getDescription() == null ? "" : dto.getDescription());
            requirement.setColor(dto.getColor() == null ? "#3b82f6" : dto.getColor());
            requirement.setSprint(sprint);
            requirement.setProject(sprint.getProject());
            requirement.setStatus(Requirement.RequirementStatus.BACKLOG);
            return requirementRepository.save(requirement);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sprintId is required for this creation endpoint");
        }
    }

    public Requirement createRequirementForProject(Long projectId, RequirementRequestDTO dto) {
        Projet project = projetRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        authorizationService.requireProjectOwner(project.getId());

        Requirement requirement = new Requirement();
        requirement.setTitle(dto.getTitle() == null || dto.getTitle().isBlank() ? "Untitled Requirement" : dto.getTitle().trim());
        requirement.setDescription(dto.getDescription() == null ? "" : dto.getDescription());
        requirement.setColor(dto.getColor() == null ? "#3b82f6" : dto.getColor());
        requirement.setProject(project);
        requirement.setStatus(Requirement.RequirementStatus.BACKLOG);
        // sprint is intentionally null — this is a backlog item

        return requirementRepository.save(requirement);
    }

    public List<Requirement> getRequirementsByProject(Long projectId) {
        return requirementRepository.findByProjectId(projectId);
    }

    public List<Requirement> getRequirementsBySprint(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));
        authorizationService.requireProjectViewer(sprint.getProject().getId());
        return requirementRepository.findBySprintSprintId(sprintId);
    }

    public Requirement getRequirementById(Long id) {
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement not found"));
        authorizationService.requireProjectViewer(requirement.getProject().getId());
        return requirement;
    }

    public Requirement updateRequirement(Long id, RequirementRequestDTO dto) {
        Requirement requirement = getRequirementById(id);
        authorizationService.requireProjectOwner(requirement.getProject().getId());

        if (dto.getTitle() != null) {
            requirement.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            requirement.setDescription(dto.getDescription());
        }
        if (dto.getColor() != null) {
            requirement.setColor(dto.getColor());
        }
        if (dto.getSprintId() != null) {
            Sprint sprint = sprintRepository.findById(dto.getSprintId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sprint not found"));
            if (sprint.getIsActive() && (requirement.getSprint() == null || sprint.getSprintId() != requirement.getSprint().getSprintId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot inject requirement directly into an active sprint.");
            }
            requirement.setSprint(sprint);
        }

        return requirementRepository.save(requirement);
    }

    public void deleteRequirement(Long id) {
        Requirement requirement = getRequirementById(id);
        authorizationService.requireProjectOwner(requirement.getProject().getId());
        requirementRepository.delete(requirement);
    }
}
