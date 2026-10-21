package com.boostup.repository;

import com.boostup.model.SprintMetricSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SprintMetricSnapshotRepository extends JpaRepository<SprintMetricSnapshot, Long> {
    Optional<SprintMetricSnapshot> findTopBySprintIdOrderByCreatedAtDesc(Long sprintId);
}
