package com.boostup.service;

import com.boostup.model.ProjectRole;
import com.boostup.model.Projet;
import com.boostup.model.User;
import com.boostup.repository.ProjetRepository;
import com.boostup.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AuthorizationService {
    private final UserRepository userRepository;
    private final ProjetRepository projetRepository;

    public AuthorizationService(UserRepository userRepository, ProjetRepository projetRepository) {
        this.userRepository = userRepository;
        this.projetRepository = projetRepository;
    }

    public User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    public boolean isAdministrator(User user) {
        return user != null && user.getRole() == User.Role.ADMINISTRATOR;
    }

    /**
     * Role the current user holds inside the given project, or {@code null} when they
     * are not part of it. Platform administrators are not owners by definition, so
     * callers that must allow them should use {@link #isAdministrator(User)} as well.
     */
    public ProjectRole getProjectRole(Long projectId) {
        User user = currentUser();
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

    public List<Long> accessibleProjectIds(User user) {
        if (isAdministrator(user)) {
            return projetRepository.findAll().stream().map(Projet::getId).toList();
        }
        return projetRepository.findDistinctByOwnerIdOrMembersId(user.getId(), user.getId())
                .stream()
                .map(Projet::getId)
                .toList();
    }

    public User requireAdministrator() {
        User user = currentUser();
        if (!isAdministrator(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only a platform ADMINISTRATOR can perform this action");
        }
        return user;
    }

    public User requireProjectOwner(Long projectId) {
        User user = currentUser();
        if (isAdministrator(user)) {
            return user;
        }
        if (getProjectRole(projectId) != ProjectRole.OWNER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the project OWNER can perform this action");
        }
        return user;
    }

    public User requireProjectEditor(Long projectId) {
        User user = currentUser();
        if (isAdministrator(user)) {
            return user;
        }
        ProjectRole role = getProjectRole(projectId);
        if (role != ProjectRole.OWNER && role != ProjectRole.MEMBER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only a project OWNER or MEMBER can perform this action");
        }
        return user;
    }

    public User requireProjectViewer(Long projectId) {
        User user = currentUser();
        if (isAdministrator(user)) {
            return user;
        }
        if (getProjectRole(projectId) == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a member of this project");
        }
        return user;
    }

    public User requireProjectOwner(Projet project) {
        return requireProjectOwner(project.getId());
    }

    public User requireProjectEditor(Projet project) {
        return requireProjectEditor(project.getId());
    }

    public User requireProjectViewer(Projet project) {
        return requireProjectViewer(project.getId());
    }
}
