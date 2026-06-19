package com.ehtp.kanban_backend.repository;

import com.ehtp.kanban_backend.model.DecisionNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DecisionNoteRepository extends JpaRepository<DecisionNote, Long> {
    List<DecisionNote> findByTaskId(Long taskId);
}
