package com.boostup.repository;

import com.boostup.model.TaskStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskStatusHistoryRepository extends JpaRepository<TaskStatusHistory, Long> {
    List<TaskStatusHistory> findByTaskIdOrderByChangedAtDesc(Long taskId);
    List<TaskStatusHistory> findByTaskIdInOrderByChangedAtAsc(List<Long> taskIds);
}
