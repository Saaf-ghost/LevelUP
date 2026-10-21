package com.boostup.repository;

import com.boostup.model.Requirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequirementRepository extends JpaRepository<Requirement, Long> {
    List<Requirement> findBySprintSprintId(Long sprintId);
    List<Requirement> findBySprintProjectId(Long projectId);
    List<Requirement> findByProjectId(Long projectId);
}
