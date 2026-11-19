package com.boostup.security;

import com.boostup.model.ProjectRole;
import com.boostup.model.Projet;
import com.boostup.model.Requirement;
import com.boostup.model.Sprint;
import com.boostup.model.Task;
import com.boostup.model.User;
import com.boostup.repository.ProjetRepository;
import com.boostup.repository.RequirementRepository;
import com.boostup.repository.SprintRepository;
import com.boostup.repository.TaskRepository;
import com.boostup.repository.UserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Method-security helper used by {@code @PreAuthorize} expressions.
 * Project access is derived from ownership/membership of one project only;
 * platform administrators bypass every project check.
 */
@Component("projectSecurity")
public class ProjectSecurityEvaluator {

    private final ProjetRepository projetRepository;
    private final SprintRepository sprintRepository;
    private final TaskRepository taskRepository;
    private final RequirementRepository requirementRepository;
    private final UserRepository userRepository;

    public ProjectSecurityEvaluator(
            ProjetRepository projetRepository,
            SprintRepository sprintRepository,
            TaskRepository taskRepository,
            RequirementRepository requirementRepository,
            UserRepository userRepository
    ) {
        this.projetRepository = projetRepository;
        this.sprintRepository = sprintRepository;
        this.taskRepository = taskRepository;
        this.requirementRepository = requirementRepository;
        this.userRepository = userRepository;
    }

    public boolean isAdministrator() {
        return currentUser()
                .map(user -> user.getRole() == User.Role.ADMINISTRATOR)
                .orElse(false);
    }

    public boolean isMember(Long projectId) {
        return isAdministrator() || projectRole(projectId) != null;
    }

    public boolean isOwner(Long projectId) {
        return isAdministrator() || projectRole(projectId) == ProjectRole.OWNER;
    }

    public boolean isSprintMember(Long sprintId) {
        return isMember(projectIdOfSprint(sprintId));
    }

    public boolean isSprintOwner(Long sprintId) {
        return isOwner(projectIdOfSprint(sprintId));
    }

    public boolean isTaskMember(Long taskId) {
        return isMember(projectIdOfTask(taskId));
    }

    public boolean isTaskOwner(Long taskId) {
        return isOwner(projectIdOfTask(taskId));
    }

    public boolean isRequirementMember(Long requirementId) {
        return isMember(projectIdOfRequirement(requirementId));
    }

    public boolean isRequirementOwner(Long requirementId) {
        return isOwner(projectIdOfRequirement(requirementId));
    }

    private ProjectRole projectRole(Long projectId) {
        if (projectId == null) {
            return null;
        }
        User user = currentUser().orElse(null);
        if (user == null) {
            return null;
        }
        Projet project = projetRepository.findById(projectId).orElse(null);
        if (project == null) {
            return null;
        }
        if (project.getOwner() != null && project.getOwner().getId() == user.getId()) {
            return ProjectRole.OWNER;
        }
        if (project.getMembers() != null && project.getMembers().stream().anyMatch(m -> m.getId() == user.getId())) {
            return ProjectRole.MEMBER;
        }
        return null;
    }

    private Long projectIdOfSprint(Long sprintId) {
        if (sprintId == null) {
            return null;
        }
        return sprintRepository.findById(sprintId)
                .map(Sprint::getProject)
                .map(Projet::getId)
                .orElse(null);
    }

    private Long projectIdOfTask(Long taskId) {
        if (taskId == null) {
            return null;
        }
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            return null;
        }
        if (task.getRequirement() != null && task.getRequirement().getProject() != null) {
            return task.getRequirement().getProject().getId();
        }
        if (task.getSprint() != null && task.getSprint().getProject() != null) {
            return task.getSprint().getProject().getId();
        }
        return null;
    }

    private Long projectIdOfRequirement(Long requirementId) {
        if (requirementId == null) {
            return null;
        }
        return requirementRepository.findById(requirementId)
                .map(Requirement::getProject)
                .map(Projet::getId)
                .orElse(null);
    }

    private Optional<User> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        return userRepository.findByEmail(authentication.getName());
    }
}
