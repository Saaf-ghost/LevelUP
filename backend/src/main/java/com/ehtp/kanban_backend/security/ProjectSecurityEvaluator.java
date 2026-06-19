package com.ehtp.kanban_backend.security;

import com.ehtp.kanban_backend.model.ProjectMembership;
import com.ehtp.kanban_backend.model.Projet;
import com.ehtp.kanban_backend.model.User;
import com.ehtp.kanban_backend.repository.ProjetRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("projectSecurity")
public class ProjectSecurityEvaluator {

    private final ProjetRepository projetRepository;

    public ProjectSecurityEvaluator(ProjetRepository projetRepository) {
        this.projetRepository = projetRepository;
    }

    public boolean hasRole(Long projectId, String roleStr) {
        if (projectId == null) {
            return false;
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String email = authentication.getName();
        Optional<Projet> projectOpt = projetRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return false;
        }
        Projet project = projectOpt.get();
        
        ProjectMembership.Role userRole = null;
        if (project.getOwner() != null && project.getOwner().getEmail().equalsIgnoreCase(email)) {
            userRole = ProjectMembership.Role.OWNER;
        } else if (project.getMembers() != null && project.getMembers().stream().anyMatch(m -> m.getEmail().equalsIgnoreCase(email))) {
            userRole = ProjectMembership.Role.MEMBER;
        }

        if (userRole == null) {
            return false;
        }

        ProjectMembership.Role requiredRole;
        try {
            requiredRole = ProjectMembership.Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return false;
        }

        if (requiredRole == ProjectMembership.Role.OWNER) {
            return userRole == ProjectMembership.Role.OWNER;
        } else if (requiredRole == ProjectMembership.Role.MEMBER) {
            return userRole == ProjectMembership.Role.OWNER || userRole == ProjectMembership.Role.MEMBER;
        } else if (requiredRole == ProjectMembership.Role.VIEWER) {
            return userRole == ProjectMembership.Role.OWNER || userRole == ProjectMembership.Role.MEMBER || userRole == ProjectMembership.Role.VIEWER;
        }
        return false;
    }
}
