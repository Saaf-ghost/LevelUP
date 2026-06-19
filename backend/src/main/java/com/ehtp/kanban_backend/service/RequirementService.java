package com.ehtp.kanban_backend.service;

import com.ehtp.kanban_backend.dto.RequirementRequestDTO;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.Requirement;
import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import com.ehtp.kanban_backend.repository.RequirementRepository;
import com.ehtp.kanban_backend.repository.SprintRepository;
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
            
            // Assert project ownership
            User currentUser = authorizationService.currentUser();
            if (sprint.getProject().getOwner().getId() != currentUser.getId()) {
                throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
            }

            if (sprint.getIsActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot inject requirement directly into an active sprint. It must go through the backlog.");
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

        // Assert project ownership
        User currentUser = authorizationService.currentUser();
        if (project.getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

        Requirement requirement = new Requirement();
        requirement.setTitle(dto.getTitle());
        requirement.setDescription(dto.getDescription() == null ? "" : dto.getDescription());
        requirement.setColor(dto.getColor() == null ? "#3b82f6" : dto.getColor());
        requirement.setProject(project);
        requirement.setStatus(Requirement.RequirementStatus.BACKLOG);

        return requirementRepository.save(requirement);
    }

    public List<Requirement> getRequirementsBySprint(Long sprintId) {
        return requirementRepository.findBySprintSprintId(sprintId);
    }

    public Requirement getRequirementById(Long id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Requirement not found"));
    }

    public Requirement updateRequirement(Long id, RequirementRequestDTO dto) {
        Requirement requirement = getRequirementById(id);
        
        User currentUser = authorizationService.currentUser();
        if (requirement.getProject().getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }

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
            if (sprint.getIsActive() && !sprint.equals(requirement.getSprint())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot inject requirement directly into an active sprint. It must go through the backlog.");
            }
            requirement.setSprint(sprint);
        }

        return requirementRepository.save(requirement);
    }

    public void deleteRequirement(Long id) {
        Requirement requirement = getRequirementById(id);
        User currentUser = authorizationService.currentUser();
        if (requirement.getProject().getOwner().getId() != currentUser.getId()) {
            throw new org.springframework.security.access.AccessDeniedException("User is not the owner of this project");
        }
        requirementRepository.delete(requirement);
    }
}
