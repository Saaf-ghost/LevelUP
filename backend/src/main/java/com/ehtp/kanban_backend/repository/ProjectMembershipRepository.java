package com.ehtp.kanban_backend.repository;

import com.ehtp.kanban_backend.model.ProjectMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, Long> {
    Optional<ProjectMembership> findByUserIdAndProjectId(Long userId, Long projectId);
    Optional<ProjectMembership> findByUserEmailAndProjectId(String email, Long projectId);
    List<ProjectMembership> findByProjectId(Long projectId);
    List<ProjectMembership> findByUserId(Long userId);
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);
}
