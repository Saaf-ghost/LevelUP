package com.ehtp.kanban_backend.dto;

import com.ehtp.kanban_backend.model.Task;
import lombok.Data;

@Data
public class TaskRequestDTO {
    private String title;
    private String description;
    private Task.Priority priority;
    private Task.TaskStatus status;
    private Integer effortPoints;
    private Integer estimatedHours;
    private Long sprintId;
    private Long requirementId;
    private Long assigneeId;
}
