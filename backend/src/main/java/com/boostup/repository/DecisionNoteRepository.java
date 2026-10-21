package com.boostup.repository;

import com.boostup.model.DecisionNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DecisionNoteRepository extends JpaRepository<DecisionNote, Long> {
    List<DecisionNote> findByTaskId(Long taskId);
}
