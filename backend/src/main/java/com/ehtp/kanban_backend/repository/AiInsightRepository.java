package com.ehtp.kanban_backend.repository;

import com.ehtp.kanban_backend.model.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {
    List<AiInsight> findBySprintSprintId(Long sprintId);
    List<AiInsight> findByProjectId(Long projectId);
}
