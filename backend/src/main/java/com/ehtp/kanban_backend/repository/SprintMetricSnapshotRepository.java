package com.ehtp.kanban_backend.repository;

import com.ehtp.kanban_backend.model.SprintMetricSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SprintMetricSnapshotRepository extends JpaRepository<SprintMetricSnapshot, Long> {
    Optional<SprintMetricSnapshot> findTopBySprintIdOrderByCreatedAtDesc(Long sprintId);
}
