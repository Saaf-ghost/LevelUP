package com.ehtp.kanban_backend.repository;

import com.ehtp.kanban_backend.model.Sprint;
import com.ehtp.kanban_backend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findBySprintSprintId(Long sprintId);

    List<Task> findBySprintProjectId(Long projectId);

    List<Task> findBySprintProjectIdAndUpdatedAtAfter(Long projectId, LocalDateTime since);

    List<Task> findBySprintAndAssigneeIdAndStatusNot(Sprint sprint, Long assigneeId, Task.TaskStatus status);

    List<Task> findBySprintSprintIdAndAssigneeId(Long sprintId, Long assigneeId);

    List<Task> findBySprintSprintIdAndStatus(Long sprintId, Task.TaskStatus status);

    List<Task> findBySprintSprintIdAndStatusIn(Long sprintId, Collection<Task.TaskStatus> statuses);
}
