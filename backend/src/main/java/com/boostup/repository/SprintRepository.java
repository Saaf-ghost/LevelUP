package com.boostup.repository;

import com.boostup.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findByProjectId(Long projectId);

    List<Sprint> findByProjectIdIn(Collection<Long> projectIds);

    List<Sprint> findByProjectIdOrderByEndDateDesc(Long projectId);

    Optional<Sprint> findByProjectIdAndSprintStatus(Long projectId, Sprint.SprintStatus sprintStatus);

    Optional<Sprint> findByProjectIdAndIsActive(Long projectId, Boolean isActive);
}
